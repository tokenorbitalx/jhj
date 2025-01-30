"use client"

import type React from "react"
import { useState } from "react"
import { MiniKit, tokenToDecimals, Tokens, type PayCommandInput } from "@worldcoin/minikit-js"
import { motion } from "framer-motion"
import { MiniKitErrorBoundary } from "./MiniKitErrorBoundary"
import { useToast } from "@/hooks/use-toast"

const sendPayment = async (amount: number, token: Tokens) => {
  try {
    const res = await fetch(`/api/initiate-payment`, {
      method: "POST",
    })

    const { id } = await res.json()
    console.log(id)

    const payload: PayCommandInput = {
      reference: id,
      to: "0x512e4a7dda6b13f917d89fa782bdd7666dab1599", // Test address
      tokens: [
        {
          symbol: token,
          token_amount: tokenToDecimals(amount, token).toString(),
        },
      ],
      description: "ORBITAL-X",
    }

    if (MiniKit.isInstalled()) {
      return await MiniKit.commandsAsync.pay(payload)
    }
    return null
  } catch (error: unknown) {
    console.log("Error sending payment", error)
    return null
  }
}

export const PayBlock = () => {
  const [amount, setAmount] = useState(0.0)
  const [token, setToken] = useState<Tokens>(Tokens.WLD)
  const { toast } = useToast()

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(Number.parseFloat(e.target.value))
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setToken(e.target.value === "USDC" ? Tokens.USDCE : Tokens.WLD)
  }

  const handlePay = async () => {
    if (!MiniKit.isInstalled()) {
      toast({
        title: "Error",
        description: "MiniKit is not installed. Please open this application in World App.",
        variant: "destructive",
      })
      return
    }
    const sendPaymentResponse = await sendPayment(amount, token)
    const response = sendPaymentResponse?.finalPayload
    if (!response) {
      toast({
        title: "Error",
        description: "Failed to send payment",
        variant: "destructive",
      })
      return
    }

    if (response.status === "success") {
      const nextAuthUrl = process.env.NEXT_PUBLIC_NEXTAUTH_URL || "http://localhost:3000"
      const res = await fetch(`${nextAuthUrl}/api/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: response }),
      })
      const payment = await res.json()
      if (payment.success) {
        toast({
          title: "Success",
          description: "Payment sent successfully!",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: "Payment failed to confirm",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <MiniKitErrorBoundary>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold mb-6 text-center">Enviar Pago</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-1">
              Cantidad
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Ingrese la cantidad"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="token" className="block text-sm font-medium mb-1">
              Token
            </label>
            <select
              id="token"
              value={token === Tokens.USDCE ? "USDC" : "WLD"}
              onChange={handleTokenChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="WLD">WLD</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 transition duration-300 ease-in-out"
            onClick={handlePay}
          >
            Pagar Ahora
          </motion.button>
        </div>
      </div>
    </MiniKitErrorBoundary>
  )
}

