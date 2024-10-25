'use client'
import type { Block, BlocksFieldClientComponent } from 'payload'

import { getTranslation } from '@payloadcms/translations'
import React, { Fragment, useCallback } from 'react'
import { v4 as uuid } from 'uuid'

import { Banner } from '../../elements/Banner/index.js'
import { Button } from '../../elements/Button/index.js'
import { DraggableSortableItem } from '../../elements/DraggableSortable/DraggableSortableItem/index.js'
import { DraggableSortable } from '../../elements/DraggableSortable/index.js'
import { DrawerToggler } from '../../elements/Drawer/index.js'
import { useDrawerSlug } from '../../elements/Drawer/useDrawerSlug.js'
import { ErrorPill } from '../../elements/ErrorPill/index.js'
import { useForm, useFormSubmitted } from '../../forms/Form/context.js'
import { extractRowsAndCollapsedIDs, toggleAllRows } from '../../forms/Form/rowHelpers.js'
import { NullifyLocaleField } from '../../forms/NullifyField/index.js'
import { useField } from '../../forms/useField/index.js'
import { withCondition } from '../../forms/withCondition/index.js'
import { useConfig } from '../../providers/Config/index.js'
import { useDocumentInfo } from '../../providers/DocumentInfo/index.js'
import { useLocale } from '../../providers/Locale/index.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { scrollToID } from '../../utilities/scrollToID.js'
import { fieldBaseClass } from '../shared/index.js'
import { BlockRow } from './BlockRow.js'
import { BlocksDrawer } from './BlocksDrawer/index.js'
import './index.scss'

const baseClass = 'blocks-field'

const BlocksFieldComponent: BlocksFieldClientComponent = (props) => {
  const { i18n, t } = useTranslation()

  const {
    Description,
    Error,
    field: {
      name,
      admin: { className, isSortable = true, readOnly: readOnlyFromAdmin } = {},
      blocks,
      labels: labelsFromProps,
      localized,
      maxRows,
      minRows: minRowsProp,
      required,
    },
    Label,
    path,
    readOnly: readOnlyFromTopLevelProps,
    schemaPath,
    validate,
  } = props

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin

  const minRows = (minRowsProp ?? required) ? 1 : 0

  const { setDocFieldPreferences } = useDocumentInfo()
  const { addFieldRow, dispatchFields, getDataByPath, setModified } = useForm()
  const { code: locale } = useLocale()
  const {
    config: { localization },
  } = useConfig()
  const drawerSlug = useDrawerSlug('blocks-drawer')
  const submitted = useFormSubmitted()

  const labels = {
    plural: t('fields:blocks'),
    singular: t('fields:block'),
    ...labelsFromProps,
  }

  const editingDefaultLocale = (() => {
    if (localization && localization.fallback) {
      const defaultLocale = localization.defaultLocale || 'en'
      return locale === defaultLocale
    }

    return true
  })()

  const memoizedValidate = useCallback(
    (value, options) => {
      // alternative locales can be null
      if (!editingDefaultLocale && value === null) {
        return true
      }
      if (typeof validate === 'function') {
        return validate(value, { ...options, maxRows, minRows, required })
      }
    },
    [maxRows, minRows, required, validate, editingDefaultLocale],
  )

  const {
    errorPaths,
    formInitializing,
    formProcessing,
    rows = [],
    showError,
    valid,
    value,
  } = useField<number>({
    hasRows: true,
    path: path ?? name,
    validate: memoizedValidate,
  })

  const disabled = readOnlyFromProps || formProcessing || formInitializing

  const addRow = useCallback(
    async (rowIndex: number, blockType: string): Promise<void> => {
      // TODO add the new row into the currentData array using the incoming rowIndex
      const newRow = { id: uuid(), blockType }

      const currentData: Block[] = getDataByPath(path)

      await addFieldRow({
        data: { [name]: [...currentData, newRow] },
        path,
        schemaPath,
      })

      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [addFieldRow, path, setModified, getDataByPath, name, schemaPath],
  )

  const duplicateRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({ type: 'DUPLICATE_ROW', path, rowIndex })
      setModified(true)

      setTimeout(() => {
        scrollToID(`${path}-row-${rowIndex + 1}`)
      }, 0)
    },
    [dispatchFields, path, setModified],
  )

  const removeRow = useCallback(
    (rowIndex: number) => {
      dispatchFields({
        type: 'REMOVE_ROW',
        path,
        rowIndex,
      })

      setModified(true)
    },
    [path, dispatchFields, setModified],
  )

  const moveRow = useCallback(
    (moveFromIndex: number, moveToIndex: number) => {
      dispatchFields({ type: 'MOVE_ROW', moveFromIndex, moveToIndex, path })
      setModified(true)
    },
    [dispatchFields, path, setModified],
  )

  const toggleCollapseAll = useCallback(
    (collapsed: boolean) => {
      const { collapsedIDs, updatedRows } = toggleAllRows({
        collapsed,
        rows,
      })
      dispatchFields({ type: 'SET_ALL_ROWS_COLLAPSED', path, updatedRows })
      setDocFieldPreferences(path, { collapsed: collapsedIDs })
    },
    [dispatchFields, path, rows, setDocFieldPreferences],
  )

  const setCollapse = useCallback(
    (rowID: string, collapsed: boolean) => {
      const { collapsedIDs, updatedRows } = extractRowsAndCollapsedIDs({
        collapsed,
        rowID,
        rows,
      })
      dispatchFields({ type: 'SET_ROW_COLLAPSED', path, updatedRows })
      setDocFieldPreferences(path, { collapsed: collapsedIDs })
    },
    [dispatchFields, path, rows, setDocFieldPreferences],
  )

  const hasMaxRows = maxRows && rows.length >= maxRows

  const fieldErrorCount = errorPaths.length
  const fieldHasErrors = submitted && fieldErrorCount + (valid ? 0 : 1) > 0

  const showMinRows = rows.length < minRows || (required && rows.length === 0)
  const showRequired = disabled && rows.length === 0

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        className,
        fieldHasErrors ? `${baseClass}--has-error` : `${baseClass}--has-no-error`,
      ]
        .filter(Boolean)
        .join(' ')}
      id={`field-${path?.replace(/\./g, '__')}`}
    >
      {showError && Error}
      <header className={`${baseClass}__header`}>
        <div className={`${baseClass}__header-wrap`}>
          <div className={`${baseClass}__heading-with-error`}>
            <h3>{Label}</h3>
            {fieldHasErrors && fieldErrorCount > 0 && (
              <ErrorPill count={fieldErrorCount} i18n={i18n} withMessage />
            )}
          </div>
          {rows.length > 0 && (
            <ul className={`${baseClass}__header-actions`}>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  onClick={() => toggleCollapseAll(true)}
                  type="button"
                >
                  {t('fields:collapseAll')}
                </button>
              </li>
              <li>
                <button
                  className={`${baseClass}__header-action`}
                  onClick={() => toggleCollapseAll(false)}
                  type="button"
                >
                  {t('fields:showAll')}
                </button>
              </li>
            </ul>
          )}
        </div>
        {Description}
      </header>
      <NullifyLocaleField fieldValue={value} localized={localized} path={path} />
      {(rows.length > 0 || (!valid && (showRequired || showMinRows))) && (
        <DraggableSortable
          className={`${baseClass}__rows`}
          ids={rows.map((row) => row.id)}
          onDragEnd={({ moveFromIndex, moveToIndex }) => moveRow(moveFromIndex, moveToIndex)}
        >
          {rows.map((row, i) => {
            const { blockType } = row
            const blockConfig = blocks.find((block) => block.slug === blockType)

            if (blockConfig) {
              const rowErrorCount = errorPaths.filter((errorPath) =>
                errorPath.startsWith(`${path}.${i}.`),
              ).length

              return (
                <DraggableSortableItem disabled={disabled || !isSortable} id={row.id} key={row.id}>
                  {(draggableSortableItemProps) => (
                    <BlockRow
                      {...draggableSortableItemProps}
                      addRow={addRow}
                      block={blockConfig}
                      blocks={blocks}
                      duplicateRow={duplicateRow}
                      errorCount={rowErrorCount}
                      fields={blockConfig.fields}
                      hasMaxRows={hasMaxRows}
                      isSortable={isSortable}
                      Label={Label}
                      labels={labels}
                      moveRow={moveRow}
                      path={path}
                      readOnly={disabled}
                      removeRow={removeRow}
                      row={row}
                      rowCount={rows.length}
                      rowIndex={i}
                      setCollapse={setCollapse}
                    />
                  )}
                </DraggableSortableItem>
              )
            }

            return null
          })}
          {!editingDefaultLocale && (
            <React.Fragment>
              {showMinRows && (
                <Banner type="error">
                  {t('validation:requiresAtLeast', {
                    count: minRows,
                    label:
                      getTranslation(minRows > 1 ? labels.plural : labels.singular, i18n) ||
                      t(minRows > 1 ? 'general:row' : 'general:rows'),
                  })}
                </Banner>
              )}
              {showRequired && (
                <Banner>
                  {t('validation:fieldHasNo', { label: getTranslation(labels.plural, i18n) })}
                </Banner>
              )}
            </React.Fragment>
          )}
        </DraggableSortable>
      )}
      {!disabled && !hasMaxRows && (
        <Fragment>
          <DrawerToggler className={`${baseClass}__drawer-toggler`} slug={drawerSlug}>
            <Button
              buttonStyle="icon-label"
              el="span"
              icon="plus"
              iconPosition="left"
              iconStyle="with-border"
            >
              {t('fields:addLabel', { label: getTranslation(labels.singular, i18n) })}
            </Button>
          </DrawerToggler>
          <BlocksDrawer
            addRow={addRow}
            addRowIndex={rows?.length || 0}
            blocks={blocks}
            drawerSlug={drawerSlug}
            labels={labels}
          />
        </Fragment>
      )}
    </div>
  )
}

export const BlocksField = withCondition(BlocksFieldComponent)
