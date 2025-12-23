import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
  });
  
  console.log('最近 5 条同步日志：\n');
  logs.forEach((log, index) => {
    console.log(`\n--- 日志 ${index + 1} ---`);
    console.log(`ID: ${log.id}`);
    console.log(`状态: ${log.status}`);
    console.log(`开始时间: ${log.startedAt}`);
    console.log(`结束时间: ${log.finishedAt || '未完成'}`);
    console.log(`消息: ${log.message}`);
    if (log.stats) {
      console.log(`统计信息:`, JSON.stringify(log.stats, null, 2));
    }
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);

