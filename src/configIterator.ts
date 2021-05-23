export default function configIterator(config: string) {
  const configObject: Record<string, any> = JSON.parse(config);
  return configObject;
}
