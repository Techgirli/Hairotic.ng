ALTER TABLE "orders" ADD COLUMN "checkout_session_id" TEXT;

CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");
