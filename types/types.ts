// types.ts

export type Column<T> = {
    header: string;
    key: keyof T;
    render: (item: T) => React.ReactNode;
  };
  