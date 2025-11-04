<script>
import { DataType } from "@visual-filter/common"

export default {
  name: "FilterCondition",
  emits: ["updateField", "deleteCondition"],
  props: {
    condition: {
      type: Object,
      required: true,
      validator(value) {
        return value.constructor === Object
      },
    },
    fieldNames: {
      type: Array,
      required: true,
    },
    methodNamesByType: {
      type: Object,
      required: true,
    },
    methodsByType: { 
      type: Object,
      required: true
    },
  },
  computed: {
    currentMethod() {
      const dataType = this.condition.dataType?.toLowerCase()
      const method = this.condition.method
      if (!dataType || !method) return null
      return this.methodsByType?.[dataType]?.[method] || null
    },
    isNumeric() {
      return this.condition.dataType === DataType.NUMERIC
    },
    isNominal() {
      return this.condition.dataType === DataType.NOMINAL
    }
  },
  methods: {
    updateField(newFieldName) {
      if (this.fieldNames.includes(newFieldName)) {
        this.$emit("updateField", this.condition, newFieldName)
      }
    },
  },
  watch: {
    'condition.method'(newMethod) {
      if (!this.currentMethod) return
      this.currentMethod.argsNames.forEach(argName => {
        if (!this.condition[argName]) this.condition[argName] = ''
      })
    }
  }
}
</script>

<template>
  <div class="space-x-2">
    <slot name="fieldUpdation" v-bind="{ fieldNames, condition, updateField }">
      <select
        v-model="condition.fieldName"
        @change="updateField($event.target.value)"
        data-testId="field-name-select"
      >
        <option v-for="field in fieldNames" :key="field" :value="field">
          {{ field }}
        </option>
      </select>
    </slot>
    <slot
      name="methodUpdation"
      v-bind="{
        methodNamesByType: methodNamesByType,
        condition,
      }"
    >
      <select v-model="condition.method" data-testId="method-select">
        <option
          v-for="method in methodNamesByType[condition.dataType.toLowerCase()]"
          :key="method"
          :value="method"
        >
          {{ method }}
        </option>
      </select>
    </slot>
    <slot name="argumentUpdation" :condition="condition">
      <template v-for="argName in currentMethod?.argsNames" :key="argName">
        <label>
          <span>{{ argName }}:</span>
          <input
            :type="isNominal ? 'text' : isNumeric ? 'number' : 'date'"
            v-model="condition[argName]"
            :placeholder="argName"
            :data-testId="`${argName}-input`"
          />
        </label>
        <template v-if="argName !== currentMethod?.argsNames.slice(-1)[0]">
          <label>AND</label>
        </template>
      </template>
    </slot>


    <slot
      name="conditionDeletion"
      :deleteCondition="() => $emit('deleteCondition', condition)"
    >
      <button @click="$emit('deleteCondition', condition)" data-testId="remove-condition-button">x</button>
    </slot>
  </div>
</template>

<style scoped>
  .space-x-2 {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  select,
  input[type="text"] {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #ccc;
    background: #fff;
    font-size: 14px;
    transition: border-color 0.2s ease;
  }

  select:focus,
  input[type="text"]:focus {
    outline: none;
    border-color: #007bff;
  }

  button[data-testId="remove-condition-button"] {
    background-color: #dc3545;
    color: #fff;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.15s ease;
  }

  button[data-testId="remove-condition-button"]:hover {
    background-color: #b02a37;
  }

  button[data-testId="remove-condition-button"]:active {
    transform: scale(0.92);
  }

  label {
    color: #007bff
  }


  /* Responsive */
  @media (max-width: 600px) {
    .space-x-2 {
      flex-wrap: wrap;
      gap: 6px;
    }

    select,
    input[type="text"] {
      width: 100%;
    }
  }
</style>
