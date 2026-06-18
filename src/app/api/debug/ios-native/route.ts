import { NextResponse } from "next/server";
import { getIosNativeDebugReport } from "@/lib/ios-native-debug";
import { isIosDebugEnabled } from "@/lib/ios-native";

export async function GET() {
  if (!isIosDebugEnabled()) {
    return NextResponse.json({ error: "IOS debug är avstängt" }, { status: 404 });
  }

  return NextResponse.json(getIosNativeDebugReport());
}
