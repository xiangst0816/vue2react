export default function configIterator(config: string) {
  const configObject: Record<string, any> = JSON.parse(config);
  delete configObject.usingComponents;
  delete configObject.usingTemplateAPI;
  return configObject;
}
