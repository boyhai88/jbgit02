export function getSafeRedirectPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  return value
}
