本目录用于后台异步任务（例如“一键同步”抓取上游应用列表、下载 APK、上传 OSS）。  
后续会在 `src/worker/worker.ts` 中实现 BullMQ/Redis 的队列消费者，并在 Docker Compose 里以独立容器运行。



