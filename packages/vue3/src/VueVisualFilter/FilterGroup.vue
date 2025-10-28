<script>
export default {
  name: "FilterGroup",
  emits: ["addFilter", "deleteGroup"],
  props: {
    group: {
      type: Object,
      required: true,
      validator(value) {
        return value.constructor === Object
      },
    },
    filterTypes: {
      type: Array,
      required: true,
    },
    groupTypes: {
      type: Array,
      required: true,
    },
    removable: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    addFilter(newFilterType) {
      if (this.filterTypes.includes(newFilterType)) {
        this.$emit("addFilter", this.group.filters, newFilterType)
      }
    },
  },
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-x-2">
      <slot name="groupTypes" v-bind="{ groupTypes, group }">
        <select v-model="group.groupType" data-testId="group-type-select">
          <option v-for="type in groupTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </slot>
      <slot name="filterAddition" v-bind="{ filterTypes, addFilter }">
        <select
          @change="addFilter($event.target.value)"
          data-testId="filter-type-select"
        >
          <option v-for="type in filterTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </slot>
      <slot
        v-if="removable"
        name="groupDeletion"
        :deleteGroup="() => $emit('deleteGroup', group)"
      >
        <button @click="$emit('deleteGroup', group)" data-testId="remove-group-button">x</button>
      </slot>
    </div>
    <div v-if="group.filters.length" class="ml-10 space-y-1">
      <slot name="groupChildren"></slot>
    </div>
  </div>
</template>

<style scoped>
  .space-y-4 {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .space-x-2 {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  select {
    padding: 6px 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 14px;
    background: #fff;
    transition: border-color 0.2s;
  }

  select:focus {
    outline: none;
    border-color: #007bff;
  }

  button[data-testId="remove-group-button"] {
    background-color: #dc3545;
    color: #fff;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    transition: 0.2s ease;
  }

  button[data-testId="remove-group-button"]:hover {
    background-color: #b02a37;
  }

  button[data-testId="remove-group-button"]:active {
    transform: scale(0.92);
  }

  .ml-10 {
    margin-left: 30px;
  }

  .space-y-1 {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .space-x-2 {
      flex-wrap: wrap;
      gap: 6px;
    }

    select {
      width: 100%;
    }

    .ml-10 {
      margin-left: 12px;
    }
  }
</style>
