import { prisma } from "@/lib/prisma";
import { SyncButton } from "./sync-button";

export const dynamic = "force-dynamic";

export default async function AdminSyncPage() {
  let logs = [];
  let dbError = false;

  try {
    logs = await prisma.syncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    dbError = true;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">同步中心</h1>
        <p className="mt-1 text-sm text-zinc-600">
          一键从上游拉取应用列表与版本，下载 APK 并上传 OSS，然后写入数据库。
        </p>
        {dbError ? (
          <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            ⚠️ 数据库连接失败，无法加载日志。请确保 PostgreSQL 数据库正在运行。
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium">立即同步</div>
        <div className="mt-4">
          <SyncButton />
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          提示：若已配置 `REDIS_URL`，同步将进入队列由 worker 执行；否则将以 inline 方式运行（不推荐生产）。
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">同步日志</div>
          <div className="text-xs text-zinc-500">最近 {logs.length} 条</div>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="py-2 pr-3">开始时间</th>
                <th className="py-2 pr-3">状态</th>
                <th className="py-2 pr-3">信息</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-black/5">
                  <td className="py-2 pr-3 text-zinc-600">
                    {new Date(l.startedAt).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs">
                      {l.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="text-zinc-700">{l.message || "-"}</div>
                    {l.stats ? (
                      <pre className="mt-1 max-w-[900px] overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
                        {JSON.stringify(l.stats, null, 2)}
                      </pre>
                    ) : null}
                  </td>
                </tr>
              ))}
              {logs.length === 0 ? (
                <tr>
                  <td className="py-6 text-sm text-zinc-500" colSpan={3}>
                    暂无日志。点击“立即同步”开始。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}




