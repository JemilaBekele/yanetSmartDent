import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { options } from "./options"; // Adjust the path if necessary
import { connect } from '@/app/lib/mongodb';
connect();
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, options);

  if (session) {
    // Return a response that instructs the client to perform the sign-out
    res.status(200).json({ message: "Session is valid, proceed with client-side sign-out." });
  } else {
    res.status(401).json({ message: "No active session." });
  }
}
