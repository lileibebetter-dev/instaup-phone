import { redirect } from "next/navigation";

export default function AppsPage() {
  // 重定向到首页，因为所有应用都在首页显示
  redirect("/");
}
