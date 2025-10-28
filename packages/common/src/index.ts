export enum FilterType {
  GROUP = "group",
  CONDITION = "condition",
}

export enum GroupType {
  AND = "and",
  NOT_AND = "not and",
  OR = "or",
  NOT_OR = "not or",
}

export enum DataType {
  NUMERIC = "numeric",
  NOMINAL = "nominal",
}

export function deepCopy(src: any): any {
  if (src.constructor === Object) {
    return Object.entries(src).reduce(
      (objCopy, [key, value]) => ({ ...objCopy, [key]: deepCopy(value) }),
      {},
    )
  }
  if (src.constructor === Array) {
    return src.map(deepCopy)
  }
  return src.valueOf()
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  if (a.constructor === Array && b.constructor === Array) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (a.constructor === Object && b.constructor === Object) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEqual(a[key], b[key]));
  }

  return a.valueOf() === b.valueOf();
}


export function saveTemplateJson(src: any, templateId: string): boolean {
  const STORAGE_KEY = 'templates.json'

  const stored = localStorage.getItem(STORAGE_KEY)
  const templates = stored ? JSON.parse(stored) : []

  // check if templateId is already exists
  const exists = templates.some((t: any) => t.id === templateId)

  if (exists) {
    alert(`⚠️ Template with id "${templateId}" already exists.`)
    return false;
  }

  const existsFilter = templates.some((t: any) => deepEqual(t.filter, src));

    if (existsFilter) {
        alert(`❤️ Template with filters "${templateId}" already exists.`)
        return false;
    }

  // build template
  const newTemplate = {
    id: templateId,
    filter: src,
    createdAt: new Date().toISOString(),
  }

  templates.push(newTemplate)

  // save
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates, null, 2))
  return true;
}


export function loadTemplateJson (templateId: string): any{
    const STORAGE_KEY = 'templates.json'

    const stored = localStorage.getItem(STORAGE_KEY)
    const templates = stored ? JSON.parse(stored) : []
    if(!templates.length){
        // alert("Unforunality, there are no saved tempalte yet")
        return { success: false, template: null }
    }
    const foundTemplate = templates.find((temp: any) => temp.id === templateId)    

    
    if (!foundTemplate) {
        alert("Template not found!");
        return { success: false, template: null };
    }

    return { success: true, template: foundTemplate.filter }
}

export function listTemplates (): any{
    const STORAGE_KEY = 'templates.json'

    const stored = localStorage.getItem(STORAGE_KEY)
    const templates = stored ? JSON.parse(stored) : []
    if(!templates.length){
        // alert("Unforunality, there are no saved tempalte yet")
        return { success: true, template: null }
    }
    
    return { success: true, template: templates }
    
}