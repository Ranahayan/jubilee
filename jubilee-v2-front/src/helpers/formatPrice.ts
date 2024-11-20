
export const formatPrice = (currency: string, priceCents: number) => {
	const finalPrice = priceCents / 100;
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency || "USD",
	});

	if (!priceCents) return formatter.format(0);

	return formatter.format(finalPrice);
};