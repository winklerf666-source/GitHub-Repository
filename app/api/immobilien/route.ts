import { NextResponse } from "next/server";
import { PropertyType, PropertyStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";

const typeToDb: Record<string, PropertyType> = {
  Wohnung: "APARTMENT",
  Haus: "HOUSE",
  Gewerbe: "COMMERCIAL",
  Grundstück: "LAND",
  Sonstige: "OTHER",
};

const typeToLabel: Record<PropertyType, string> = {
  APARTMENT: "Wohnung",
  HOUSE: "Haus",
  COMMERCIAL: "Gewerbe",
  LAND: "Grundstück",
  OTHER: "Sonstige",
};

const statusToDb: Record<string, PropertyStatus> = {
  Entwurf: "DRAFT",
  Aktiv: "ACTIVE",
  Reserviert: "RESERVED",
  Verkauft: "SOLD",
  Vermietet: "RENTED",
  Archiviert: "ARCHIVED",
};
