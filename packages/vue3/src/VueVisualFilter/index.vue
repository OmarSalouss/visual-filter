<script>
import { h } from "vue"
import {
  FilterType,
  GroupType,
  DataType,
  deepCopy,
} from "@visual-filter/common"
import applyFilter from "@visual-filter/applyer"

import FilterGroup from "./FilterGroup.vue"
import FilterCondition from "./FilterCondition.vue"

// If we add a short delay when typing in fields, it will prevent updates on every key event.
function debounce(func, wait) {
  let timeout
  return function(...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export default {
  name: "VueVisualFilter",
  emits: ["filterUpdate", "beforeChange"],
  props: {
    filteringOptions: {
      type: Object,
      required: true,
      validator(value) {
        try {
          const isAllFnsValid = Object.values(value.methods).every((methodGroup) =>
            Object.values(methodGroup).every(
              (method) => typeof method.fn === "function"
            )
          );
          
          return (
            value.data.length &&
            value.data.every(
              (field, index, fields) =>
                typeof field.name === "string" &&
                typeof field.type === "string" &&
                field.values.constructor === Array &&
                (index > 0
                  ? field.values.length === fields[index - 1].values.length
                  : true),
            ) && isAllFnsValid
          )
        } catch {
          return false
        }
      },
    },
  },
  data() {
    return {
      filter: {
        type: FilterType.GROUP,
        groupType: GroupType.AND,
        filters: [],
      },
    }
  },
  computed: {
    fieldNames() {
      return this.filteringOptions.data.map((field) => field.name)
    },
    methodNamesByType() {
      const methods = this.filteringOptions?.methods || {}
      const result = {}
      
      for (const type in methods) {
        result[type.toLowerCase()] = Object.keys(methods[type])
      }
      return result
    },
  },
  watch: {
    filter: {
      deep: true,
      handler: debounce(function() {
        // only emit every 300ms, not on every key click
        this.$emit("filterUpdate", {
          filter: deepCopy(this.filter),
          data: applyFilter(this.filter, this.filteringOptions.methods, deepCopy(this.filteringOptions.data)),
        })
      }, 300)
    }
  },
  methods: {
    updateConditionField(condition, newFieldName) {
      const {
        type: newType,
        values: [newSampleValue = ""],
      } = this.filteringOptions.data.find(
        (field) => field.name === newFieldName,
      )
      if (condition.dataType !== newType) {
        const methodsForType = this.methodNamesByType[newType.toLowerCase()] || []
        condition.method = methodsForType[0]
        condition.argument = newSampleValue
        condition.dataType = newType
      } else {
        condition.argument = newSampleValue // same type, then update the sample value
      }
    },
    addFilter(filters, newFilterType) {
      this.$emit("beforeChange", {
        action: "beforeAdd",
        currentFilter: deepCopy(this.filter),
      })
      if (newFilterType === FilterType.GROUP) {
        filters.push({
          type: FilterType.GROUP,
          groupType: GroupType.AND,
          filters: [],
        })
      } else {
        const {
          name,
          type,
          values: [sampleValue = ""],
        } = this.filteringOptions.data[0]
        const methodsForType = this.methodNamesByType[type.toLowerCase()] || []
        filters.push({
          type: FilterType.CONDITION,
          fieldName: name,
          dataType: type,
          method: methodsForType[0],
          argument: sampleValue,
        })
      }
    },
    deleteFilter(filterToDelete) {
      this.$emit("beforeChange", {
        action: "beforeDelete",
        currentFilter: deepCopy(this.filter),
      })
      function recursiveDeletion(filter, index, filters) {
        if (filter === filterToDelete) {
          filters.splice(index, 1)
        } else if (filter.type === FilterType.GROUP) {
          filter.filters.map(recursiveDeletion)
        }
      }

      if (filterToDelete !== this.filter) {
        recursiveDeletion(this.filter)
      }
    },
  },
  render() {
    const createVisualizer = (filter) => {
      if (filter.type === FilterType.GROUP) {
        return h(
          FilterGroup,
          {
            group: filter,
            filterTypes: Object.values(FilterType),
            groupTypes: Object.values(GroupType),
            removable: filter !== this.filter,
            onAddFilter: this.addFilter,
            onDeleteGroup: this.deleteFilter,
          },
          {
            groupTypes: this.$slots.groupTypes,
            filterAddition: this.$slots.filterAddition,
            groupDeletion: this.$slots.groupDeletion,
            groupChildren: () => filter.filters.map(createVisualizer),
          },
        )
      } else {
        return h(
          FilterCondition,
          {
            condition: filter,
            fieldNames: this.fieldNames,
            methodNamesByType: this.methodNamesByType,
            methodsByType: this.filteringOptions.methods,
            onUpdateField: this.updateConditionField,
            onDeleteCondition: this.deleteFilter,
          },
          {
            fieldUpdation: this.$slots.fieldUpdation,
            methodUpdation: this.$slots.methodUpdation,
            argumentUpdation: this.$slots.argumentUpdation,
            conditionDeletion: this.$slots.conditionDeletion,
          },
        )
      }
    }

    return createVisualizer(this.filter)
  },
}
</script>
