

import React from "react";
import {
  ControllerRenderProps,
  FieldValues,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Edit, X, Plus } from "lucide-react";
import { registerPlugin } from "filepond";
import { FilePond } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

interface FormFieldProps {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "textarea"
    | "number"
    | "select"
    | "multiselect"
    | "switch"
    | "password"
    | "file"
    | "multi-input";
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  value?: string;
  disabled?: boolean;
  multiple?: boolean;
  isIcon?: boolean;
  initialValue?: string | number | boolean | string[];
  readOnly?: boolean; // Thêm prop readOnly
}

export const CustomFormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  options,
  accept,
  className,
  inputClassName,
  labelClassName,
  disabled = false,
  multiple = false,
  isIcon = false,
  initialValue,
  readOnly = false, // Giá trị mặc định là false
}) => {
  const { control } = useFormContext();

  const renderFormControl = (
    field: ControllerRenderProps<FieldValues, string>
  ) => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            placeholder={placeholder}
            {...field}
            rows={3}
            className={`border-gray-200 p-4 ${inputClassName}`}
            readOnly={readOnly || disabled} // Thêm readOnly
          />
        );
      case "select":
        return (
          <Select
            value={field.value || (initialValue as string)}
            defaultValue={field.value || (initialValue as string)}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={`w-full border-gray-200 p-4 ${inputClassName}`}
              disabled={disabled}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="w-full border-gray-200 shadow">
              {options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={`cursor-pointer hover:!bg-gray-100 hover:!text-customgreys-darkGrey`}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        // them moi multi select
        case "multiselect":
          return (
            <div className="space-y-2">
              <div className="border rounded-md p-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.isArray(field.value) && field.value.length > 0 ? (
                    field.value.map((val: string) => (
                      <span
                        key={val}
                        className="flex items-center gap-1 bg-gray-100 text-sm px-3 py-1 rounded-full"
                      >
                        {val}
                        <button
                          type="button"
                          onClick={() =>
                            field.onChange(field.value.filter((v: string) => v !== val))
                          }
                          className="text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">
                     Chưa chọn tiện ích nào
                    </span>
                  )}
                </div>

                <Select
                  onValueChange={(value) => {
                    const current = Array.isArray(field.value) ? field.value : [];
                    if (!current.includes(value)) {
                      field.onChange([...current, value]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full border-gray-200">
                    <SelectValue placeholder="Chọn tiện ích..." />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );

        case "switch":
          return (
            <div className="flex items-center space-x-2">
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                id={name}
                className={`text-customgreys-dirtyGrey ${inputClassName}`}
              />
              <FormLabel htmlFor={name} className={labelClassName}>
                {label}
              </FormLabel>
            </div>
          );
        case "file":
          return (
            <FilePond
              className={`${inputClassName}`}
              onupdatefiles={(fileItems) => {
                const files = fileItems.map((fileItem) => fileItem.file);
                field.onChange(files);
              }}
              allowMultiple={true}
              labelIdle={`Kéo & thả hình ảnh của bạn vào đây hoặc <span class="filepond--label-action">Chọn tệp</span>`}
            credits={false}
            />
          );
      case "number":
        return (
          <Input
            type="number"
            placeholder={placeholder}
            {...field}
            className={`border-gray-200 p-4 ${inputClassName}`}
            disabled={disabled}
            readOnly={readOnly} // Thêm readOnly
          />
        );
      case "multi-input":
        return (
          <MultiInputField
            name={name}
            control={control}
            placeholder={placeholder}
            inputClassName={inputClassName}
            disabled={disabled}
          />
        );
      default:
        return (
          <Input
            type={type}
            placeholder={placeholder}
            {...field}
            className={`border-gray-200 p-4 ${inputClassName}`}
            disabled={disabled}
            readOnly={readOnly} // Thêm readOnly
            
          />
        );
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      defaultValue={initialValue}
      render={({ field }) => (
        <FormItem
          className={`${
            type !== "switch" && "rounded-md"
          } relative ${className}`}
        >
          {type !== "switch" && (
            <div className="flex justify-between items-center">
              <FormLabel className={`text-sm ${labelClassName}`}>
                {label}
              </FormLabel>

              {!disabled &&
                isIcon &&
                type !== "file" &&
                type !== "multi-input" && (
                  <Edit className="size-4 text-customgreys-dirtyGrey" />
                )}
            </div>
          )}
          <FormControl>
            {renderFormControl({
              ...field,
              value: field.value !== undefined ? field.value : initialValue,
            })}
          </FormControl>
          <FormMessage className="text-red-400" />
        </FormItem>
      )}
    />
  );
};

interface MultiInputFieldProps {
  name: string;
  control: any;
  placeholder?: string;
  inputClassName?: string;
  disabled?: boolean; // Thêm disabled cho MultiInputField
}

const MultiInputField: React.FC<MultiInputFieldProps> = ({
  name,
  control,
  placeholder,
  inputClassName,
  disabled = false,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center space-x-2">
          <FormField
            control={control}
            name={`${name}.${index}`}
            render={({ field }) => (
              <FormControl>
                <Input
                  {...field}
                  placeholder={placeholder}
                  className={`flex-1 border-none bg-customgreys-darkGrey p-4 ${inputClassName}`}
                  disabled={disabled}
                />
              </FormControl>
            )}
          />
          {!disabled && (
            <Button
              type="button"
              onClick={() => remove(index)}
              variant="ghost"
              size="icon"
              className="text-customgreys-dirtyGrey"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      {!disabled && (
        <Button
          type="button"
          onClick={() => append("")}
          variant="outline"
          size="sm"
          className="mt-2 text-customgreys-dirtyGrey"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm mục
        </Button>
      )}
    </div>
  );
};