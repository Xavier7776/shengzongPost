param(
  [Parameter(Mandatory)][ValidateSet('Initialize','SealRecoveryKey','ReadPassphrase','ExportPortableKey')][string]$Mode,
  [Parameter(Mandatory)][string]$KeyDirectory,
  [string]$CertificatePath,
  [string]$PortableKeyPath
)
$ErrorActionPreference = 'Stop'
if (-not $IsWindows) { throw 'Windows CurrentUser DPAPI is required.' }
$keyDirectoryPath = [IO.Path]::GetFullPath($KeyDirectory)
$keyPath = Join-Path $keyDirectoryPath 'recovery-key.dpapi'
$passwordPath = Join-Path $keyDirectoryPath 'recovery-passphrase.dpapi'
$sealedPath = Join-Path $keyDirectoryPath 'recovery-private-encrypted.pem'
if ($Mode -eq 'ExportPortableKey') {
  if (-not $PortableKeyPath) { throw 'PortableKeyPath is required.' }
  $portablePath = [IO.Path]::GetFullPath($PortableKeyPath)
  if (Test-Path -LiteralPath $portablePath) { throw 'Refusing to replace an existing portable recovery key.' }
  $privateBytes = [Security.Cryptography.ProtectedData]::Unprotect(
    [IO.File]::ReadAllBytes($keyPath), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  $pemBytes = [Text.Encoding]::UTF8.GetBytes([Security.Cryptography.PemEncoding]::WriteString('PRIVATE KEY', $privateBytes))
  try {
    $stream = [IO.File]::Open($portablePath, [IO.FileMode]::CreateNew)
    try { $stream.Write($pemBytes) } finally { $stream.Dispose() }
  } finally {
    [Security.Cryptography.CryptographicOperations]::ZeroMemory($pemBytes)
    [Security.Cryptography.CryptographicOperations]::ZeroMemory($privateBytes)
  }
  Write-Output 'Portable recovery key exported to the authorized local file; key contents were not logged.'
  exit
}
function Save-SealedKey($key) {
  if ((Test-Path -LiteralPath $passwordPath) -or (Test-Path -LiteralPath $sealedPath)) {
    throw 'Refusing to replace an existing sealed recovery key.'
  }
  $password = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
  $passwordBytes = [Text.Encoding]::UTF8.GetBytes($password)
  try {
    $parameters = [Security.Cryptography.PbeParameters]::new(
      [Security.Cryptography.PbeEncryptionAlgorithm]::Aes256Cbc,
      [Security.Cryptography.HashAlgorithmName]::SHA256, 600000)
    $sealed = $key.ExportEncryptedPkcs8PrivateKey($password, $parameters)
    $protectedPassword = [Security.Cryptography.ProtectedData]::Protect(
      $passwordBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    [IO.File]::WriteAllBytes($passwordPath, $protectedPassword)
    [IO.File]::WriteAllText($sealedPath,
      [Security.Cryptography.PemEncoding]::WriteString('ENCRYPTED PRIVATE KEY', $sealed), [Text.UTF8Encoding]::new($false))
  } finally { [Security.Cryptography.CryptographicOperations]::ZeroMemory($passwordBytes) }
}
if ($Mode -eq 'ReadPassphrase') {
  $passwordBytes = [Security.Cryptography.ProtectedData]::Unprotect(
    [IO.File]::ReadAllBytes($passwordPath), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  try { [Console]::Out.WriteLine([Text.Encoding]::UTF8.GetString($passwordBytes)) }
  finally { [Security.Cryptography.CryptographicOperations]::ZeroMemory($passwordBytes) }
  exit
}
if ($Mode -eq 'SealRecoveryKey') {
  $privateBytes = [Security.Cryptography.ProtectedData]::Unprotect(
    [IO.File]::ReadAllBytes($keyPath), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  $rsa = [Security.Cryptography.RSA]::Create()
  try { $read = 0; $rsa.ImportPkcs8PrivateKey($privateBytes, [ref]$read); Save-SealedKey $rsa }
  finally { $rsa.Dispose(); [Security.Cryptography.CryptographicOperations]::ZeroMemory($privateBytes) }
  Write-Output 'Recovery key sealed without writing plaintext private key.'
  exit
}
if (-not $CertificatePath) { throw 'CertificatePath is required.' }
$certificateFile = [IO.Path]::GetFullPath($CertificatePath)
if ((Test-Path -LiteralPath $keyPath) -or (Test-Path -LiteralPath $certificateFile)) {
  throw 'Refusing to replace an existing recovery key or certificate.'
}
if (Test-Path -LiteralPath $keyDirectoryPath) {
  throw 'Initialize requires a new dedicated key directory.'
}
New-Item -ItemType Directory -Path $keyDirectoryPath | Out-Null
$acl = [Security.AccessControl.DirectorySecurity]::new()
$acl.SetAccessRuleProtection($true, $false)
foreach ($sid in @([Security.Principal.WindowsIdentity]::GetCurrent().User,
    [Security.Principal.SecurityIdentifier]::new('S-1-5-18'))) {
  $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
    $sid, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow'))
}
Set-Acl -LiteralPath $keyDirectoryPath -AclObject $acl
$rsa = [Security.Cryptography.RSA]::Create(3072)
try {
  $request = [Security.Cryptography.X509Certificates.CertificateRequest]::new(
    'CN=shengzongPost Backup Recovery', $rsa, [Security.Cryptography.HashAlgorithmName]::SHA256,
    [Security.Cryptography.RSASignaturePadding]::Pkcs1)
  $request.CertificateExtensions.Add([Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new(
    [Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyEncipherment, $true))
  $cert = $request.CreateSelfSigned([DateTimeOffset]::UtcNow.AddMinutes(-5), [DateTimeOffset]::UtcNow.AddYears(10))
  $privateBytes = $rsa.ExportPkcs8PrivateKey()
  try {
    $protectedBytes = [Security.Cryptography.ProtectedData]::Protect(
      $privateBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    $stream = [IO.File]::Open($keyPath, [IO.FileMode]::CreateNew)
    try { $stream.Write($protectedBytes) } finally { $stream.Dispose() }
  } finally { [Security.Cryptography.CryptographicOperations]::ZeroMemory($privateBytes) }
  Save-SealedKey $rsa
  [IO.File]::WriteAllText($certificateFile, $cert.ExportCertificatePem(), [Text.UTF8Encoding]::new($false))
  Write-Output "Recovery public certificate initialized; private key is protected by CurrentUser DPAPI."
} finally { $rsa.Dispose() }
