import { Response } from 'express';

interface SendResponseParams {
  res: Response;
  status: boolean;
  message: string;
  data?: any;
  statusCode?: number;
}

function sendResponse({ res, status, message, data = null, statusCode = 200 }: SendResponseParams) {
  return res.status(statusCode).json({ status, message, data });
}

export default sendResponse;
