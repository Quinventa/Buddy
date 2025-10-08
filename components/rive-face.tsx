"use client"

import React, { useEffect, useRef } from "react"
import { useRive, useStateMachineInput } from "@rive-app/react-canvas"

interface RiveFaceProps {
  currentPhoneme?: string | null
  isSpeaking?: boolean
  className?: string
}

/**
 * Maps phonemes to Rive animation indices
 * Based on your Rive setup:
 * 0 = Default
 * 1 = O
 * 2 = CDGKNSTXYZ
 * 3 = EE
 * 4 = BMP
 * 5 = AEI
 * 6 = U
 * 7 = TH
 * 8 = SH_CH_J
 * 9 = QW
 * 10 = L
 * 11 = FV
 */
function phonemeToMouthShape(phoneme: string | null | undefined): number {
  if (!phoneme) return 0 // Default

  const p = phoneme.toUpperCase()

  // O sound (1)
  if (p.includes("O") || p.includes("AO") || p.includes("OW")) return 1

  // CDGKNSTXYZ sounds (2)
  if (
    p.includes("C") ||
    p.includes("D") ||
    p.includes("G") ||
    p.includes("K") ||
    p.includes("N") ||
    p.includes("S") ||
    p.includes("T") ||
    p.includes("X") ||
    p.includes("Y") ||
    p.includes("Z")
  ) {
    return 2
  }

  // EE sound (3)
  if (
    p.includes("EE") ||
    p.includes("IY") ||
    p.includes("IH")
  ) {
    return 3
  }

  // BMP sounds (4)
  if (p.includes("B") || p.includes("M") || p.includes("P")) return 4

  // AEI sounds (5)
  if (
    p.includes("A") ||
    p.includes("E") ||
    p.includes("I") ||
    p.includes("AE") ||
    p.includes("AH") ||
    p.includes("AY")
  ) {
    return 5
  }

  // U sound (6)
  if (p.includes("U") || p.includes("UH")) return 6

  // TH sound (7)
  if (p.includes("TH") || p.includes("DH")) return 7

  // SH_CH_J sounds (8)
  if (
    p.includes("SH") ||
    p.includes("CH") ||
    p.includes("J") ||
    p.includes("ZH")
  ) {
    return 8
  }

  // QW sounds (9)
  if (p.includes("Q") || p.includes("W") || p.includes("UW")) return 9

  // L sound (10)
  if (p.includes("L")) return 10

  // FV sounds (11)
  if (p.includes("F") || p.includes("V")) return 11

  return 0 // Default for unknown phonemes
}

export function RiveFace({ currentPhoneme, isSpeaking, className }: RiveFaceProps) {
  const { rive, RiveComponent } = useRive({
    src: "/faces.riv", // Your Rive file in the public folder
    stateMachines: "FaceStateMachine",
    autoplay: true,
  })

  // Get the mouthShape input from the state machine
  const mouthShapeInput = useStateMachineInput(
    rive,
    "FaceStateMachine",
    "mouthShape"
  )

  // Update mouth shape based on current phoneme
  useEffect(() => {
    if (mouthShapeInput && isSpeaking && currentPhoneme) {
      const shapeIndex = phonemeToMouthShape(currentPhoneme)
      console.log(`🎭 Phoneme: ${currentPhoneme} → Mouth Shape: ${shapeIndex}`)
      mouthShapeInput.value = shapeIndex
    } else if (mouthShapeInput && !isSpeaking) {
      // Return to default (0) when not speaking
      mouthShapeInput.value = 0 // Default when idle
    }
  }, [currentPhoneme, isSpeaking, mouthShapeInput])

  return (
    <div className={className}>
      <RiveComponent className="w-full h-full" />
    </div>
  )
}
