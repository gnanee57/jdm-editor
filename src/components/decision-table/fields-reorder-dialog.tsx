import { Card, Form, Modal, Typography } from 'antd'
import clsx from 'clsx'
import React, { useEffect, useRef, useState } from 'react'
import { XYCoord, useDrag, useDrop } from 'react-dnd'

import { Stack } from '../stack'
import { TableSchemaItem } from './dt.context'

export type FieldsReorderProps = {
  fields?: TableSchemaItem[]
  onSuccess?: (columns: TableSchemaItem[]) => void
  onDismiss?: () => void
  isOpen?: boolean
}

interface DragItem {
  index: number
  id: string
  type: string
}

const FieldCard: React.FC<{
  col: TableSchemaItem
  index: number
  moveCard: (dragIndex: number, hoverIndex: number) => void
}> = ({ col, index, moveCard }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [, drop] = useDrop<DragItem, void>({
    accept: 'col',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveCard(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: 'col',
    item: () => {
      return { id: col.id, index }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0 : 1
  drag(drop(ref))
  return (
    <Card
      ref={ref}
      style={{ opacity }}
      bodyStyle={{ padding: '0.5rem' }}
      className={clsx(false && 'grl-table__fields-reorder__card--dragging')}
    >
      <div className='grl-dt__fields-reorder__item'>
        <Stack horizontal verticalAlign='center'>
          <div className='grl-dt__fields-reorder__handle'>=</div>
          <Stack grow gap={0}>
            <Typography.Text>{col?.name}</Typography.Text>
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              {col?.field}
            </Typography.Text>
          </Stack>
        </Stack>
      </div>
    </Card>
  )
}

export const FieldsReorder: React.VFC<FieldsReorderProps> = (props) => {
  const { isOpen, onDismiss, onSuccess, fields } = props

  const [columns, setColumns] = useState<TableSchemaItem[]>([])

  useEffect(() => {
    if (isOpen) {
      setColumns([...(fields || [])])
    }
  }, [isOpen, fields])

  const moveCard = (from: number, to: number) => {
    // dropped outside the list
    if (!to) {
      return
    }
    const tmpList = [...columns]

    const element = tmpList.splice(from, 1)[0]
    tmpList.splice(to, 0, element)
    setColumns(tmpList)
  }

  return (
    <Modal
      title='Reorder fields'
      open={isOpen}
      onCancel={onDismiss}
      width={360}
      destroyOnClose
      bodyStyle={{
        paddingTop: 17,
      }}
      okText='Update'
      okButtonProps={{
        htmlType: 'submit',
        form: 'fields-reorder-dialog',
      }}
    >
      <Form
        id='fields-reorder-dialog'
        onFinish={() => {
          onSuccess?.(columns)
        }}
      >
        <Stack gap={8} horizontalAlign='stretch'>
          {columns.map((column, index) => (
            <FieldCard
              key={column.id}
              col={column}
              index={index}
              moveCard={moveCard}
            />
          ))}
        </Stack>
      </Form>
    </Modal>
  )
}
