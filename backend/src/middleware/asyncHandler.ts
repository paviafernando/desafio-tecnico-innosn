import type { NextFunction, Request, Response } from "express";

type ManejadorAsincrono = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export function asyncHandler(fn: ManejadorAsincrono) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
