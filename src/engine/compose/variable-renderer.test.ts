import { describe, it, expect } from 'vitest'
import { VariableRenderer } from './variable-renderer'

describe('VariableRenderer', () => {
  const renderer = new VariableRenderer()

  describe('render', () => {
    it('should replace variables in content', () => {
      const content = 'Hello {{name}}!'
      const variables = { name: 'World' }
      expect(renderer.render('file.txt', content, variables)).toBe(
        'Hello World!'
      )
    })

    it('should replace multiple variables', () => {
      const content = '{{greeting}} {{name}}!'
      const variables = { greeting: 'Hello', name: 'World' }
      expect(renderer.render('file.txt', content, variables)).toBe(
        'Hello World!'
      )
    })

    it('should replace same variable multiple times', () => {
      const content = '{{name}} is {{name}}'
      const variables = { name: 'John' }
      expect(renderer.render('file.txt', content, variables)).toBe(
        'John is John'
      )
    })

    it('should return content unchanged when no variables', () => {
      const content = 'No variables here'
      const variables = {}
      expect(renderer.render('file.txt', content, variables)).toBe(
        'No variables here'
      )
    })

    it('should return content unchanged when variables is empty object', () => {
      const content = 'Hello {{name}}!'
      const variables = {}
      expect(renderer.render('file.txt', content, variables)).toBe(
        'Hello {{name}}!'
      )
    })

    it('should not replace partial matches', () => {
      const content = '{{name}} and {{named}}'
      const variables = { name: 'John' }
      expect(renderer.render('file.txt', content, variables)).toBe(
        'John and {{named}}'
      )
    })

    it('should handle variables with special characters in values', () => {
      const content = '{{code}}'
      const variables = { code: 'console.log("hello")' }
      expect(renderer.render('file.txt', content, variables)).toBe(
        'console.log("hello")'
      )
    })
  })

  describe('isBinaryFile', () => {
    it('should return true for .png files', () => {
      expect(renderer.render('image.png', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .jpg files', () => {
      expect(renderer.render('photo.jpg', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .jpeg files', () => {
      expect(renderer.render('photo.jpeg', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .gif files', () => {
      expect(renderer.render('anim.gif', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .webp files', () => {
      expect(renderer.render('image.webp', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .ico files', () => {
      expect(renderer.render('icon.ico', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .pdf files', () => {
      expect(renderer.render('doc.pdf', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .zip files', () => {
      expect(renderer.render('archive.zip', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for .gz files', () => {
      expect(renderer.render('file.gz', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for uppercase extensions', () => {
      expect(renderer.render('image.PNG', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should return true for mixed case extensions', () => {
      expect(renderer.render('image.Png', '{{name}}', { name: 'John' })).toBe(
        '{{name}}'
      )
    })

    it('should replace variables in text files', () => {
      const content = '{{var}}'
      const variables = { var: 'value' }
      expect(renderer.render('file.txt', content, variables)).toBe('value')
    })

    it('should handle files without extensions', () => {
      const content = '{{var}}'
      const variables = { var: 'value' }
      expect(renderer.render('Makefile', content, variables)).toBe('value')
    })

    it('should handle files with multiple dots', () => {
      const content = '{{var}}'
      const variables = { var: 'value' }
      expect(renderer.render('file.test.txt', content, variables)).toBe('value')
    })
  })
})
