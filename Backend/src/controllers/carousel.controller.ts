// src/controllers/carousel.controller.ts

import { Request, Response } from "express";
import { Carousel } from "../models/carousel.model";
import fs from "fs/promises";
import path from "path";
import { AppError } from "../utils/AppError";

const getBaseUrl = (req: Request) => `${req.protocol}://${req.get("host")}`;

export const getPublicItems = async (req: Request, res: Response) => {
  const activeItems = await Carousel.findAll({
    where: { isActive: true },
    order: [["order", "ASC"]],
  });
  res.status(200).json(activeItems);
};

export const getAllItems = async (req: Request, res: Response) => {
  const items = await Carousel.findAll({
    order: [["order", "ASC"]],
  });
  res.status(200).json(items);
};

export const createItem = async (req: Request, res: Response) => {
  const {
    title,
    subtitle,
    link,
    order,
    isActive,
    desktopImageUrl: providedDesktopUrl,
    mobileImageUrl: providedMobileUrl,
  } = req.body;
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const desktopFiles = files?.desktopImage;
  const mobileFiles = files?.mobileImage;

  if (!desktopFiles || desktopFiles.length === 0) {
    if (!providedDesktopUrl) {
      throw new AppError("Se requiere imagen de escritorio: sube un archivo o proporciona una URL.", 400);
    }
  }

  const desktopImageUrl =
    desktopFiles && desktopFiles.length > 0
      ? `${getBaseUrl(req)}/uploads/carousel/${desktopFiles[0]!.filename}`
      : providedDesktopUrl;

  const mobileImageUrl =
    mobileFiles && mobileFiles.length > 0
      ? `${getBaseUrl(req)}/uploads/carousel/${mobileFiles[0]!.filename}`
      : providedMobileUrl || null;

  const newItem = await Carousel.create({
    title,
    subtitle: subtitle || null,
    link: link || null,
    order: parseInt(order, 10) || 0,
    isActive: isActive === "true" || isActive === true,
    desktopImageUrl,
    mobileImageUrl: mobileImageUrl || null,
  });

  res.status(201).json(newItem);
};

export const updateItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title,
    subtitle,
    link,
    order,
    isActive,
    desktopImageUrl: providedDesktopUrl,
    mobileImageUrl: providedMobileUrl,
  } = req.body;
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  const item = await Carousel.findByPk(id);
  if (!item) {
    throw new AppError("Item no encontrado.", 404);
  }

  const desktopFiles = files?.desktopImage;
  const mobileFiles = files?.mobileImage;

  try {
    const tryDeleteLocalFile = async (url?: string) => {
      if (!url) return;
      const baseUrl = getBaseUrl(req);
      const appearsLocal =
        url.startsWith(baseUrl) ||
        url.startsWith("/uploads/") ||
        url.includes("/uploads/carousel/");
      if (!appearsLocal) return;

      const oldFilename = path.basename(url);
      const filePath = path.resolve("uploads", "carousel", oldFilename);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (err) {
        return;
      }
    };

    if (desktopFiles && desktopFiles.length > 0) {
      await tryDeleteLocalFile(item.desktopImageUrl);
      item.desktopImageUrl = `${getBaseUrl(req)}/uploads/carousel/${desktopFiles[0]!.filename}`;
    } else if (providedDesktopUrl) {
      item.desktopImageUrl = providedDesktopUrl;
    }

    if (mobileFiles && mobileFiles.length > 0) {
      await tryDeleteLocalFile(item.mobileImageUrl || undefined);
      item.mobileImageUrl = `${getBaseUrl(req)}/uploads/carousel/${mobileFiles[0]!.filename}`;
    } else if (providedMobileUrl) {
      item.mobileImageUrl = providedMobileUrl;
    }
  } catch (error) {
    console.error(`Error al procesar imágenes para el item ${id}:`, error);
  }

  if (title !== undefined) item.title = title;
  if (subtitle !== undefined) item.subtitle = subtitle || null;
  if (link !== undefined) item.link = link || null;
  if (order !== undefined) item.order = parseInt(order, 10);
  if (isActive !== undefined)
    item.isActive = isActive === "true" || isActive === true;

  await item.save();
  res.status(200).json(item);
};

export const deleteItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const item = await Carousel.findByPk(id);

  if (!item) {
    throw new AppError("Item no encontrado.", 404);
  }

  try {
    const tryDeleteLocalFile = async (url?: string) => {
        if (!url) return;
        const appearsLocal =
            url.startsWith(getBaseUrl(req)) ||
            url.startsWith("/uploads/") ||
            url.includes("/uploads/carousel/");
        if (!appearsLocal) return;
        const oldFilename = path.basename(url);
        const filePath = path.resolve("uploads", "carousel", oldFilename);
        try {
            await fs.access(filePath);
            await fs.unlink(filePath);
        } catch (err) {
            return;
        }
    };

    await tryDeleteLocalFile(item.desktopImageUrl);
    if (item.mobileImageUrl) {
      await tryDeleteLocalFile(item.mobileImageUrl);
    }
  } catch (error) {
    console.error(`Error al eliminar archivos de imagen para el item ${id}:`, error);
  }

  await item.destroy();
  res.status(204).send();
};
