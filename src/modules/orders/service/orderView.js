function customerOrderView(value) {
  const order = value?.toObject ? value.toObject() : { ...value };
  order.items = (order.items || []).map((item) => {
    const next = { ...item };
    if (next.selectedOffer) {
      const {
        baseUnitPrice, markupPercent, markupAmount, supplierId,
        invitationId, selectedBy, ...selected
      } = next.selectedOffer;
      next.selectedOffer = selected;
    }
    return next;
  });
  return order;
}

module.exports = { customerOrderView };
