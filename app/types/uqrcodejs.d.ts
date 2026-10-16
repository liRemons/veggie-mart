declare module 'uqrcodejs' {
  interface QRCodeInstance {
    data: string
    size: number
    margin: number
    areaColor: string
    canvasContext: unknown
    [key: string]: unknown
    make(): void
    drawCanvas(): Promise<void>
  }

  const QRCode: new (options?: Record<string, unknown>) => QRCodeInstance

  export default QRCode
}