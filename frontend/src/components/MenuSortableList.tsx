"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GripVertical, FileText } from "lucide-react";

// 메뉴 아이템 타입 정의
interface Menu {
  id: string;
  name: string;
  url: string;
  description: string;
  icon?: string;
  sortOrder?: number;
}

// 아이콘 매핑 타입 정의
interface IconMapping {
  [key: string]: React.ComponentType<{ className?: string }>;
}

// props 타입 정의
interface MenuSortableListProps {
  allMenus: Menu[];
  selectedMenuIds: string[];
  onMenuToggle: (menuId: string) => void;
  onListOrderChange: (orderedAllMenus: Menu[]) => void;
  iconMap: IconMapping;
  loading: boolean;
  initialSortOrders?: Record<string, number>;
}

// 정렬 가능한 메뉴 항목 컴포넌트
const SortableMenuItem = ({
  menu,
  isSelected,
  onToggle,
  iconMap,
}: {
  menu: Menu;
  isSelected: boolean;
  onToggle: () => void;
  iconMap: IconMapping;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const IconToRender =
    menu.icon && iconMap[menu.icon] ? iconMap[menu.icon] : FileText;

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[100px]">
        <div className="flex items-center space-x-2">
          <div {...attributes} {...listeners} className="cursor-grab p-1">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle()}
            id={`menu-${menu.id}`}
          />
        </div>
      </TableCell>
      <TableCell>
        <IconToRender className="h-4 w-4" />
      </TableCell>
      <TableCell className="font-medium">{menu.name}</TableCell>
      <TableCell>{menu.url}</TableCell>
      <TableCell>{menu.description}</TableCell>
    </TableRow>
  );
};

// 메인 컴포넌트
const MenuSortableList: React.FC<MenuSortableListProps> = ({
  allMenus,
  selectedMenuIds,
  onMenuToggle,
  onListOrderChange,
  iconMap,
  loading,
  initialSortOrders,
}) => {
  const [items, setItems] = useState<Menu[]>([]);

  useEffect(() => {
    const sortedItems = [...allMenus].sort((a, b) => {
      const orderA = initialSortOrders?.[a.id];
      const orderB = initialSortOrders?.[b.id];
      if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
      if (orderA !== undefined) return -1;
      if (orderB !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
    setItems(sortedItems);
  }, [allMenus, initialSortOrders]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onListOrderChange(newItems);
    }
  };

  return (
    <div className="rounded-md border max-h-[400px] overflow-y-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">순서/선택</TableHead>
              <TableHead className="w-[70px]">아이콘</TableHead>
              <TableHead>메뉴 이름</TableHead>
              <TableHead>메뉴 URL</TableHead>
              <TableHead>설명</TableHead>
            </TableRow>
          </TableHeader>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-muted-foreground"
                  >
                    메뉴 로딩 중...
                  </TableCell>
                </TableRow>
              ) : items.length > 0 ? (
                items.map((menu) => (
                  <SortableMenuItem
                    key={menu.id}
                    menu={menu}
                    isSelected={selectedMenuIds.includes(menu.id)}
                    onToggle={() => onMenuToggle(menu.id)}
                    iconMap={iconMap}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-muted-foreground"
                  >
                    등록된 메뉴가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
};

export default MenuSortableList;
