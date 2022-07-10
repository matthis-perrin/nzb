export function notifyError(msg?: string): (err: unknown) => void {
  return (err: unknown): void => {
    console.log(msg, err);
  };
}
