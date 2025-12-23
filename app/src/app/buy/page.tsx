import { redirect } from "next/navigation";

export default function BuyPage() {
  // 重定向到首页，因为购买卡密功能已取消
  redirect("/");
}

