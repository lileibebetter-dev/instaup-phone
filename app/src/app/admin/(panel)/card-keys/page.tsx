import { redirect } from "next/navigation";

export default function AdminCardKeysPage() {
  // 卡密管理功能已移除，重定向到应用管理
  redirect("/admin/apps");
}
