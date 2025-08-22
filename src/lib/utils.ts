
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Item } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUniqueSubItemId(allItems: Item[]): string {
  let maxId = 0;
  allItems.forEach(item => {
    // Ensure subItems exists and is an array before trying to iterate
    (item.subItems || []).forEach(subItem => {
      const idAsNumber = parseInt(subItem.id, 10);
      if (!isNaN(idAsNumber) && idAsNumber > maxId) {
        maxId = idAsNumber;
      }
    });
  });

  const newId = maxId + 1;
  return String(newId).padStart(6, '0');
}

export function generateInitialIds(items: Item[]): Item[] {
  let nextId = 0;
   items.forEach(item => {
    item.subItems.forEach(subItem => {
      // Handle cases where subItem.id might be empty or not a valid number string
      if (subItem.id) {
          const idAsNumber = parseInt(subItem.id, 10);
          if (!isNaN(idAsNumber) && idAsNumber > nextId) {
            nextId = idAsNumber;
          }
      }
    });
  });

  return items.map(item => ({
    ...item,
    subItems: item.subItems.map(subItem => {
      if (subItem.id && subItem.id.trim() !== '') return subItem;
      nextId++;
      return {
        ...subItem,
        id: String(nextId).padStart(6, '0'),
      };
    }),
  }));
}
