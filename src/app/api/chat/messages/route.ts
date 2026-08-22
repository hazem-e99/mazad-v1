import { connectDB } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import "@/models/User";
import { jsonOk, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await connectDB();
    const messages = await ChatMessage.find({}).sort({ createdAt: -1 }).limit(50).populate("user", "name");
    return jsonOk(messages.reverse());
  } catch (err) {
    return handleApiError(err);
  }
}
