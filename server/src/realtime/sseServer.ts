import { Request, Response } from "express";

type Client = { id: string; res: Response; userId: string };

const clients: Client[] = [];

export const subscribe = (req: Request, res: Response) => {
  // req.user được authMiddleware thiết lập (cognito sub)
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).end();
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const clientId = `${userId}-${Date.now()}-${Math.random()}`;
  const newClient: Client = { id: clientId, res, userId };
  clients.push(newClient);

  // gửi heartbeat để giữ connection sống nếu cần
  const ping = setInterval(() => res.write(":\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(ping);
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx !== -1) clients.splice(idx, 1);
  });
};

// Gửi notification tới 1 user
export const pushNotificationToUser = (recipientCognitoId: string, payload: any) => {
  const targets = clients.filter(c => c.userId === recipientCognitoId);
  targets.forEach((client) => {
    try {
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      // ignore
    }
  });
};

// (tùy chọn) gửi tới tất cả
export const pushToAll = (payload: any) => {
  clients.forEach(c => {
    try {
      c.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {}
  });
};
