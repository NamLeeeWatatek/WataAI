/**
 * Utility functions for handling variable expressions in node configurations
 * Similar to n8n's variable system
 */

export interface VariableContext {
  nodes?: Record<string, any>
  trigger?: {
    body?: Record<string, any>
    headers?: Record<string, any>
    query?: Record<string, any>
  }
  workflow?: Record<string, any>
  global?: Record<string, any>
}

/**
 * Resolve a variable expression like {{node.input}} or {{trigger.body.field}}
 */
export function resolveVariable(expression: string, context: VariableContext = {}): any {
  // Remove {{ and }} from expression
  const cleanExpr = expression.replace(/^\{\{|\}\}$/g, '').trim()

  if (!cleanExpr) return expression

  // Split by dots to get path
  const parts = cleanExpr.split('.')

  if (parts.length === 0) return expression

  const [root, ...path] = parts

  let current: any = null

  // Resolve root context
  switch (root) {
    case 'trigger':
      current = context.trigger
      break
    case 'workflow':
      current = context.workflow
      break
    case 'global':
      current = context.global
      break
    default:
      // Check if it's a node reference like node.input
      if (root.startsWith('node')) {
        current = context.nodes?.[root]
      } else {
        // Unknown root, return original expression
        return expression
      }
  }

  if (!current) return expression

  // Navigate through the path
  for (const part of path) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      // Path doesn't exist, return original expression
      return expression
    }
  }

  return current
}

/**
 * Resolve all variable expressions in a string
 */
export function resolveVariablesInString(str: string, context: VariableContext = {}): string {
  if (typeof str !== 'string') return str

  return str.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
    const resolved = resolveVariable(`{{${expression}}}`, context)
    return resolved !== match ? String(resolved) : match
  })
}

/**
 * Resolve variables in an object recursively
 */
export function resolveVariablesInObject(obj: any, context: VariableContext = {}): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return resolveVariablesInString(obj, context)
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) {
    return obj.map(item => resolveVariablesInObject(item, context))
  }

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveVariablesInObject(value, context)
  }
  return result
}

/**
 * Extract variable expressions from a string
 */
export function extractVariables(str: string): string[] {
  if (typeof str !== 'string') return []

  const matches = str.match(/\{\{([^}]+)\}\}/g)
  if (!matches) return []

  return matches.map(match => match.replace(/^\{\{|\}\}$/g, '').trim())
}

/**
 * Validate a variable expression
 */
export function isValidVariableExpression(expression: string): boolean {
  // Basic validation - should be wrapped in {{ }}
  if (!/^\{\{[^}]+\}\}$/.test(expression)) return false

  const cleanExpr = expression.replace(/^\{\{|\}\}$/g, '').trim()

  // Should have at least one dot or be a simple reference
  if (!cleanExpr.includes('.') && !cleanExpr.startsWith('$')) {
    // Allow simple references like {{$node}} but require structured paths
    return false
  }

  return true
}

/**
 * Get available variable suggestions for autocomplete
 */
export function getVariableSuggestions(context: VariableContext = {}): string[] {
  const suggestions: string[] = []

  // Trigger variables
  if (context.trigger?.body) {
    Object.keys(context.trigger.body).forEach(key => {
      suggestions.push(`trigger.body.${key}`)
    })
  }

  // Node variables
  if (context.nodes) {
    Object.keys(context.nodes).forEach(nodeId => {
      suggestions.push(`node.${nodeId}`)
    })
  }

  // Workflow variables
  if (context.workflow) {
    Object.keys(context.workflow).forEach(key => {
      suggestions.push(`workflow.${key}`)
    })
  }

  // Global variables
  if (context.global) {
    Object.keys(context.global).forEach(key => {
      suggestions.push(`global.${key}`)
    })
  }

  return suggestions
}
