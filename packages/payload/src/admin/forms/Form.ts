import { type SupportedLanguages } from '@payloadcms/translations'

import type { DocumentPermissions } from '../../auth/types.js'
import type { Field } from '../../fields/config/types.js'
import type { DocumentPreferences } from '../../preferences/types.js'
import type { PayloadRequest, Where } from '../../types/index.js'

export type Data = {
  [key: string]: any
}

export type Row = {
  blockType?: string
  collapsed?: boolean
  id: string
}

export type FilterOptionsResult = {
  [relation: string]: boolean | Where
}

export type FieldState = {
  customComponents?: {
    AfterInput?: React.ReactNode
    BeforeInput?: React.ReactNode
    Description?: React.ReactNode
    Error?: React.ReactNode
    Field?: React.ReactNode
    Label?: React.ReactNode
  }
  disableFormData?: boolean
  errorMessage?: string
  errorPaths?: string[]
  /**
   * The fieldSchema may be part of the form state if `includeSchema: true` is passed to buildFormState.
   * This will never be in the form state of the client.
   */
  fieldSchema?: Field
  filterOptions?: FilterOptionsResult
  initialValue: unknown
  isSidebar?: boolean
  passesCondition?: boolean
  requiresRender?: boolean
  rows?: Row[]
  valid: boolean
  value: unknown
}

export type FieldStateWithoutComponents = Omit<FieldState, 'customComponents'>

export type FormState = {
  [path: string]: FieldState
}

export type FormStateWithoutComponents = {
  [path: string]: FieldStateWithoutComponents
}

export type BuildFormStateArgs = {
  data?: Data
  docPermissions: DocumentPermissions
  docPreferences: DocumentPreferences
  formState?: FormState
  id?: number | string
  /*
    If not i18n was passed, the language can be passed to init i18n
  */
  language?: keyof SupportedLanguages
  locale?: string
  operation?: 'create' | 'update'
  /*
   Used as a "base path" when adding form state to nested fields
  */
  path?: (number | string)[]
  /*
    If true, will render field components within their state object
  */
  renderFields?: boolean
  req: PayloadRequest
  returnLockStatus?: boolean
  schemaPath: string
  updateLastEdited?: boolean
} & (
  | {
      collectionSlug: string
      // Do not type it as never. This still makes it so that either collectionSlug or globalSlug is required, but makes it easier to provide both collectionSlug and globalSlug if it's
      // unclear which one is actually available.
      globalSlug?: string
    }
  | {
      collectionSlug?: string
      globalSlug: string
    }
)
