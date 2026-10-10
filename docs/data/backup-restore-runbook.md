# M11 备份与恢复运行手册

2026-10-10，执行人Codex，授权人/桌面及另一台电脑保管人：用户。用户批准“先放到桌面”，随后明确“密钥放桌面”，并表示已经备份到其他电脑。以下桌面副本和可移植密钥已实施；未修改生产数据库、应用密钥、08:30精读任务或站点DSN。

## 当前结果

- 桌面加密副本：`C:/Users/Administrator/Desktop/shengzongPost-Encrypted-Backups/2026-10-10T06-29-33-162Z-1b38be5c-09b3-4ada-a461-63ff029b1528.cms`，722424字节，SHA256 `3a6c2fcf3a7094f2a8be492c4b1ca94089b1ecf91cbd8eb4455665185c5e45a9`。对应JSON为成功清单；公钥为同目录`recovery-public.pem`。
- 可跨电脑密钥：`C:/Users/Administrator/Desktop/shengzongPost-Recovery-Key/recovery-private.pem`，同目录有验证脚本和使用说明。密钥新生成后仍需同步；不能用旧DPAPI文件替代。目录ACL只允许当前用户/SYSTEM，密钥内容未进Git、日志或聊天。此PEM按用户要求可直接使用，没有口令，取得它即可解密整个库。
- 本机DPAPI加密副本保留于`%LOCALAPPDATA%/shengzongPostBackupKeys`，不删除旧副本。私钥另用PKCS#8 AES256-CBC/PBKDF2-SHA256 600000轮、48字节随机口令加密；口令由CurrentUser DPAPI保护。该副本用于本机恢复，不具备跨电脑可移植性。
- 用桌面PEM和独立验证脚本解开真实CMS成功：`authenticated=true`、`PGDMP`、721811字节、`requiresDPAPI=false`，不访问本机受保护目录或写明文dump。尚未在用户另一台电脑实机执行。
- 目标RPO24小时、RTO60分钟已随方案批准。代码交付后已通过Codex应用启用当前聊天的每日北京时间03:00备份任务，ID `shengzongpost` / ACTIVE，本机China Standard Time。尚未发生首个定时触发，不能称无人值守运行已通过。单次本机导出/恢复结果不能当作异地故障恢复SLA，电脑离线或任务失败会超过目标。

- 交付后按定时命令手动执行一次新的生产只读导出，07:01:33.414Z–07:01:45.440Z：CMS735775字节、SHA256 `87496a0a3b8fcad5d94466d187d6ad79063af282ad1972e86f75ee238bf621e7`。清单含pg_dump17.11/OpenSSL3.5.7，大小/哈希核对通过；桌面独立脚本验证authenticated/PGDMP735162字节/requiresDPAPI=false。未覆盖先前恢复演练归档，也未对这个新归档重复执行数据库恢复。

## 真实独立文件恢复演练

生产只读repeatable-read事务在`2026-10-10T06:29:30.533966+00:00`导出快照`00000012-00000002-1`，保持事务直至pg_dump结束。27张public表共1693行；完整archive还含9张neon_auth托管表。OnlyUs/Supabase是独立数据库，不在本备份内。

导出2026-10-10T06:29:33.163Z–2026-10-10T06:29:46.127Z，原生二进制流直接进入OpenSSL，不经过Windows文本管道或明文文件。两个进程退出0才登记成功；此次归档包含public27表和neon_auth9表，不含集群角色/密码、ownership或ACL。

新分支`br-dry-truth-a18ntqb1` / `codex-m11-desktop-restore-20261010`并非main/default/primary。新建空数据库`m11_backup_restore`，先核对public表0，再GCM认证解密、检查archive目录，单事务恢复。06:31:37.981Z–06:32:11.083Z约33.1秒，public27表每条记录的全行聚合哈希、所有sequence值与导出快照一致；posts115/公开104、users5、Edition1且孤儿0，244列、71个pg_constraint、85索引。information_schema会额外把NOT NULL列计为约束，不能把其241与pg_constraint71混为一谈。

托管认证9表在随后独立只读核对时与源库哈希一致，只有project_config1行，总库记录1694；该部分是恢复后观察，不声称与先前public检查点共用快照。没有导出配置内容或认证密钥到报告。托管认证服务实际启动/账号登录未测试，不把表恢复当作服务迁移。

四条当前应用SQL在恢复库通过：Agent检索返回聚合1行、文章分页12行、tag COUNT1行、全局标签115行。证据`m11-desktop-backup.json`、`m11-backup-checkpoint.json`、`m11-desktop-restore.json`、`m11-restored-queries.json`位于Git外`D:/download/search-v2-validation`。

## 另一个同提供商恢复演练

此前05:32:20.416533Z/LSN`0/36B79770`创建快照`snap-cool-hill-a13ymucc`，`restore_snapshot(finalize=false)`且不传target_branch_id，得到`br-proud-butterfly-a1oy65mr`。文章115/公开104、账号5、Edition1/无孤儿及固定五条文章哈希一致，analytics287/skills49/gallery5/projects2一致。快照至ready11秒，有限核对1分53.742秒。没有finalize、DSN切换或main恢复。该演练不替代桌面的独立文件恢复。

## 工具、连接与操作

Windows PostgreSQL客户端17.11，仅解压官方EDB ZIP的pgsql/bin，不安装/启动数据库服务；[官方Windows页面](https://www.postgresql.org/download/windows/)链接到[EDB客户端来源](https://www.enterprisedb.com/download-postgresql-binaries)，下载链接fileid1260616，ZIP SHA256`80379B2C04D51C30225532E0AE04509899141E9957ED096FE749D7FD9DF8F82F`。OpenSSL为现有3.5.7。工具位于`%LOCALAPPDATA%/shengzongPostBackupTools/pgsql/bin`，OpenSSL本机路径`D:/miniconda3/Library/bin/openssl.exe`。

生产连接只在子进程环境，非pooler endpoint；TLS verify-full验证证书与主机名。Windows客户端默认system CA验证失败，使用本机LocalMachine Root的44张已信任公开根证书导出PEM，未关闭校验或添加信任根。bundle SHA256`A5848E0CA1BDF76ACA8C58F0688790CD76895F04467940AECFD7899A573BD9B5`。实际server_version_num170011、default_transaction_read_only=on。

`node scripts/database-backup.mjs backup`所需环境：PG_DUMP_PATH、OPENSSL_PATH、BACKUP_CERTIFICATE、BACKUP_DIRECTORY、BACKUP_DATABASE_URL、Windows本机BACKUP_CA_CERTIFICATE。BACKUP_SNAPSHOT仅在调用者保持导出事务时使用。不得从日志/命令行参数或Git读取生产凭据。

```text
pg_dump --format=custom --no-owner --no-acl --no-password --lock-wait-timeout=5s
  stdout(binary) -> openssl cms -encrypt -binary -aes-256-gcm -outform DER
                   -recip <public.pem> -keyopt rsa_padding_mode:oaep
                   -keyopt rsa_oaep_md:sha256 -out <unique-run>.partial
```

导出与加密都退出0且有有效大小后才把partial原子改名为cms并写JSON成功清单，记录时间/大小/文件SHA256/公钥SHA256；后续代码同时记录工具版本。导出/加密失败写独立failed.json并保留旧成功副本，前置连接器/证书校验失败需在任务记录中明确失败，不能按文件存在报成功。工具stderr可能含私有记录，屏蔽原文，仅固定错误类别。20分钟执行上限，锁等待5秒/数据库语句15分钟。[pg_dump17](https://www.postgresql.org/docs/17/app-pgdump.html)、[CMS GCM](https://docs.openssl.org/3.5/man1/openssl-cms/)

跨电脑验证：复制桌面恢复密钥文件夹和备份文件夹，安装Node24/OpenSSL3.5，在恢复密钥目录运行`node database-backup.mjs verify <backup.cms>`。该模式验证GCM及PGDMP，明文仅在受限内存中，随后清除缓冲区。最多256MiB归档；超限停止，不自动转为磁盘明文。

恢复先GCM完整认证再把内存archive送入`pg_restore --dbname=m11_backup_restore --no-owner --no-acl --single-transaction --exit-on-error --no-password`。恢复API验证事先批准的host和独立测试库名；调用者仍须核对新分支/新空库，明确host不同于main。禁止clean/drop、覆盖原库、自动切换DSN或重发旧文章。失败停止并保留证据，生产继续使用现有连接。

## 计划、保留与费用

项目crimson-cloud-17403928/main br-old-truth-a1bnmt7i，PG17，新加坡，实际free_v3/history21600秒/branch limit10/逻辑大小1GiB。Free6小时是历史窗口，不是已证明RPO；当前1手工快照额度已使用，不能用每日新快照实现7天留存。Free无定时快照，不升级计划/保留期。付费历史约$0.20/GB月、快照约$0.09/GB月、额外分支$1.50/月比例计费，以实际账单为准。[Neon计划](https://github.com/neondatabase/website/blob/main/content/docs/introduction/plans.md)、[历史窗口](https://github.com/neondatabase/website/blob/main/content/docs/postgres/backup-restore/history-window.md)

批准的目标是7个成功日副本。首次实施保留所有成功/失败文件与恢复分支，不自动删除旧文件；超过7日后先列过期候选并确认异地副本。定时任务只在新失败、距上次成功超过26小时或需要处理时通知，正常日备份保持安静。本机账号/连接器须可用，日程不修改08:30精读任务。

## 未批准的生产维护

只读孤儿/限流报告见query-growth-and-orphans.md。过期桶初次候选0，不代表永久0。以下仅方案，不在任务中执行：

```sql
SELECT COUNT(*) AS candidates FROM auth_rate_limits
WHERE window_started_at < NOW() - INTERVAL '7 days';
-- Only after explicit production DELETE approval and a fresh bounded count:
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DELETE FROM auth_rate_limits WHERE window_started_at < NOW() - INTERVAL '7 days';
-- ROLLBACK on count mismatch; do not log subject_hash. Commit only within approved bounds.
```

未创建只读专用角色，当前授权连接器角色neondb_owner与实际Vercel运行角色是否相同未证实。旧权限、RLS、应用密钥、055/056、资产与历史内容不因备份而修改。
