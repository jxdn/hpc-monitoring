# XDMoD MySQL Schema (`modw` database)

## Resource Identification

The `modw.resourcefact` table maps each HPC cluster to a numeric `resource_id` used throughout the schema.

### `modw.resourcefact`
| Column | Type | Notes |
|--------|------|-------|
| id | int | Primary key |
| code | varchar | Short cluster code (use for filtering) |
| name | varchar | Full cluster name |
| resourcetype_id | int | FK to resourcetype |
| organization_id | int | FK to organization |
| start_date_ts | int | Epoch when resource was added |
| end_date_ts | int | Epoch when resource was retired |

**Known clusters:**
| id | code | name |
|----|------|------|
| 1 | hopper | hopper-cluster-gpu |
| 83 | vanda | vanda |

### Resource Filter Pattern
All queries should join `modw.resourcefact` and filter by `rf.code`:
```sql
INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
WHERE rf.code = 'hopper'  -- or 'vanda'
```

---

## Core Tables

### `modw.job_tasks`
Primary table for individual job task records.

Key columns:
| Column | Type | Notes |
|--------|------|-------|
| job_record_id | int | FK to job_records |
| job_id | int | Internal job identifier |
| resource_id | int | FK to resourcefact.id |
| systemaccount_id | int | FK to systemaccount.id |
| submit_time_ts | int | Unix timestamp of job submission |
| start_time_ts | int | Unix timestamp of job start |
| end_time_ts | int | Unix timestamp of job end |
| eligible_time_ts | int | Unix timestamp of job eligibility |
| waitduration | int | Seconds waiting in queue |
| wallduration | int | Seconds of actual runtime |
| gpu_count | int | Number of GPUs requested |
| gpu_time | int | GPU-seconds consumed |
| cpu_time | int | CPU-seconds consumed |
| node_count | int | Number of nodes used |
| processor_count | int | Number of CPUs used |
| memory_kb | int | Memory in KB |
| exit_code | varchar | Job exit code |
| exit_state | varchar | Job exit state |

### `modw.job_records`
Metadata about each job submission (one job_record to many job_tasks for array jobs).

Key columns:
| Column | Type | Notes |
|--------|------|-------|
| job_record_id | int | Primary key (joins to job_tasks) |
| queue | varchar | PBS queue name where job was submitted |
| account | varchar | Account/project name |
| name | varchar | Job name |

### `modw.systemaccount`
User accounts on the cluster.

Key columns:
| Column | Type | Notes |
|--------|------|-------|
| id | int | Primary key |
| username | varchar | Unix username |
| person_id | int | FK to person |

---

## Queue Names Per Cluster

### Hopper queues (GPU queues)
- AISG queues: `AISG_large`, `AISG_debug`, `AISG_guest`
- NUS-IT queues: `small`, `interactive`, `medium`, `special`, `large`
- All queues: `interactive`, `medium`, `long`, `large`, `small`, `special`, `AISG_debug`, `AISG_large`, `AISG_guest`

### Vanda queues
- GPU queues: `batch_gpu`, `gpu`, `gpu_amd`, `interactive_gpu`
- All queues: `auto`, `auto_free`, `batch_cpu`, `batch_gpu`, `cpu_parallel`, `cpu_serial`, `gpu`, `gpu_amd`, `interactive_cpu`, `interactive_gpu`, `large_mem`, `workq`

---

## Example Queries

### GPU usage by user (resource-filtered)
```sql
SELECT
  sa.username,
  COUNT(*) AS num_jobs,
  COALESCE(SUM(jt.gpu_count), 0) AS total_gpus_used,
  COALESCE(SUM(jt.gpu_time), 0) / 3600.0 AS total_gpu_hours
FROM
  modw.job_tasks jt
  JOIN modw.systemaccount sa ON jt.systemaccount_id = sa.id
  INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
WHERE
  FROM_UNIXTIME(jt.end_time_ts) >= CURDATE() - INTERVAL 7 DAY
  AND jt.gpu_count > 0
  AND rf.code = 'hopper'  -- or 'vanda'
GROUP BY sa.username
ORDER BY total_gpu_hours DESC
LIMIT 7;
```

### Queue wait time (resource + queue filtered)
```sql
SELECT
  DATE_FORMAT(FROM_UNIXTIME(jt.end_time_ts), '%Y-%m-%d') AS date,
  jr.queue AS queue_name,
  COUNT(DISTINCT jt.job_id) AS num_jobs,
  ROUND(AVG(jt.waitduration / 60.0), 1) AS avg_wait_minutes
FROM
  modw.job_tasks jt
  INNER JOIN modw.job_records jr ON jt.job_record_id = jr.job_record_id
  INNER JOIN modw.resourcefact rf ON jt.resource_id = rf.id
WHERE
  FROM_UNIXTIME(jt.end_time_ts) >= CURDATE() - INTERVAL 7 DAY
  AND jt.gpu_count > 0
  AND rf.code = 'hopper'
  AND jr.queue IN ('AISG_large', 'AISG_debug', 'AISG_guest')
GROUP BY date, jr.queue
ORDER BY date DESC, jr.queue;
```
