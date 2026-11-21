export type Quantity = {qty: number; unit: string};

export function canonicalQuantity({qty, unit}: Quantity): Quantity {
 if (unit === 'kg') return {qty: qty * 1000, unit: 'g'};
 if (unit === 'l' || unit === 'L') return {qty: qty * 1000, unit: 'ml'};
 return {qty, unit};
}

export function recipeQuantity(ingredient: {g?: number; qty?: number; unit?: string}): Quantity {
 if (typeof ingredient.qty === 'number' && Number.isFinite(ingredient.qty) && ingredient.qty > 0 && ingredient.unit?.trim()) {
  return {qty: ingredient.qty, unit: ingredient.unit.trim()};
 }
 return {qty: Number.isFinite(ingredient.g) && (ingredient.g ?? 0) > 0 ? ingredient.g! : 0, unit: 'g'};
}

export function quantityLabel(qty: number, unit: string) {
 return qty > 0 ? `${Number(qty.toFixed(6))} ${unit}` : 'Amount unspecified';
}
