<script>
import {
  FilterType,
  GroupType,
  DataType,
  deepCopy,
  saveTemplateJson,
  loadTemplateJson,
  listTemplates
} from "@visual-filter/common"

export default {
  name: "Serve",
  data() {
    return {
      filteringOptions: {
        data: [
          {
            name: "First Name",
            type: "nominal",
            values: ["Obada", "Ahmad", "Omar"],
          },
          {
            name: "Last Name",
            type: "nominal",
            values: ["Khalili", "Drhili", "Hala hili"],
          },
          {
            name: "Grade",
            type: "numeric",
            values: [3.72, 3.52, 3.4],
          },
          {
            name: "Date",
            type: "date",
            values: ["2025-10-13", "2025-12-02", "2026-06-06"],
          },
        ],
        methods: {
          numeric: {
            "=": {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                return cellValue == argument
              }
            },
            ">": {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                return cellValue > argument
              }
            },
            "<": {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                return cellValue < argument
              }
            },
            "!=": {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                return cellValue != argument
              }
            }
          },
          nominal: {
            contains: {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                return cellValue.includes(argument)
              }
            },
            startsWith: {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                return cellValue.startsWith(argument)
              }
            },
            endsWith: {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                return cellValue.endsWith(argument)
              }
            }
          },
          date: {
            before: {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                const cell = new Date(cellValue)
                const arg = new Date(argument)
                if (isNaN(cell.getTime()) || isNaN(arg.getTime())) return false
                return cell < arg
              }
            },
            after: {
              argsNumber: 1,
              argsNames: ['argument'],
              fn(cellValue, argument) {
                const cell = new Date(cellValue)
                const arg = new Date(argument)
                if (isNaN(cell.getTime()) || isNaN(arg.getTime())) return false
                return cell > arg
              }
            },
            isBetween: {
              argsNumber: 2,
              argsNames: ['startDate', 'endDate'],
              fn(cellValue, startDate, endDate) {
                const cellDate = new Date(cellValue)
                const start = new Date(startDate)
                const end = new Date(endDate)
                if ([cellDate, start, end].some(d => isNaN(d))) return false
                return cellDate >= start && cellDate <= end
              }
            },
            isBetweenThreeDates: {
              argsNumber: 3,
              argsNames: ['startDate', 'middleDate', 'endDate'],
              fn(cellValue, startDate, middleDate, endDate) {
                const cellDate = new Date(cellValue)
                const start = new Date(startDate)
                const middle = new Date(middleDate)
                const end = new Date(endDate)

                if ([cellDate, start, middle, end].some(d => isNaN(d))) return false
                return (cellDate >= start && cellDate <= middle) ||
                      (cellDate >= middle && cellDate <= end)
              }
            },
            isWithinMultipleRanges: {
              argsNumber: 4,
              argsNames: ['range1Start', 'range1End', 'range2Start', 'range2End'],
              fn(cellValue, range1Start, range1End, range2Start, range2End) {
                const cellDate = new Date(cellValue)
                const r1Start = new Date(range1Start)
                const r1End = new Date(range1End)
                const r2Start = new Date(range2Start)
                const r2End = new Date(range2End)
                if ([cellDate, r1Start, r1End, r2Start, r2End].some(d => isNaN(d))) return false
                return (cellDate >= r1Start && cellDate <= r1End) ||
                      (cellDate >= r2Start && cellDate <= r2End)
              }
            }
          }
        }
      },
      currentFilter: null,
      undoHistory : [],
      redoHistory : [],
      templates: [],
      baseUrl : '',
      hasSavedFilterInStorage: false,
    }
  },
  computed: {
    hasFilters() {
      return this.currentFilter?.filters?.length > 0
    },
    hasSavedFilter() {
      return this.hasSavedFilterInStorage
    },
    hasTemplates() {
      return (this.templates || this.templates?.length > 0)
    },
    canUndo() {
      return this.undoHistory?.length > 0
    },
    canRedo() {
      return this.redoHistory?.length > 0
    },
  },
  methods: {
    saveToHistory() {
      if (this.currentFilter) {
        this.undoHistory.push(deepCopy(this.currentFilter))
        this.redoHistory = []
      }
    },

    handleBeforeChange() {
      this.saveToHistory()
    },
    
    captureFilterUpdate(ctx) {
      const filterChanged = JSON.stringify(this.currentFilter) !== JSON.stringify(ctx.filter)
      if (filterChanged && this.currentFilter) {
        this.saveToHistory()
      }

      this.currentFilter = ctx.filter
      console.log(ctx)
    },
    
    saveFilter() {
      localStorage.setItem('savedFilter', JSON.stringify(this.currentFilter))
      this.hasSavedFilterInStorage = true
      alert('Filter saved ✅')
    },

    loadFilter() {
      const saved = localStorage.getItem('savedFilter')
      if (saved) {
        try {
          const parsedFilter = JSON.parse(saved)
          if (!parsedFilter.type || !parsedFilter.filters) {
            throw new Error('Invalid filter format')
          }
          this.saveToHistory()
          this.$refs.filterComponent.filter = parsedFilter
          alert('Filter loaded ✅')
        } catch (err) {
          alert('Failed to load filter')
          this.hasSavedFilterInStorage = false
        }
      } else {
        alert('No saved filter found ⚠️')
      }
    },

    resetFilters() {
      this.saveToHistory()
      this.$refs.filterComponent.filter = {
        type: FilterType.GROUP,
        groupType: GroupType.AND,
        filters: []
      };
    },

    undo() {
      if(this.undoHistory && this.undoHistory.length > 0) {
        this.redoHistory.push(deepCopy(this.currentFilter))
        let previousHistory = this.undoHistory.pop()
        this.$refs.filterComponent.filter  = previousHistory
        this.currentFilter = previousHistory
      } else {
        alert('Oops!! nothing to undo ⚠️')
      }
    },

    redo() {
      if(this.redoHistory && this.redoHistory.length > 0) {
        this.undoHistory.push(deepCopy(this.currentFilter))
        let nextState = this.redoHistory.pop()
        this.$refs.filterComponent.filter = nextState
        this.currentFilter = nextState
        
      } else {
        alert('Oops!! nothing to redo ⚠️')
      }
    },

    saveTemplate() {
      if(!this.hasFilters) {
        alert('No filter build yet, please create a filter first')
        return
      }

      const templateId = prompt(
        "Enter template ID (used in URL, e.g., 'high-achievers'):"
      )
      if (!templateId) {
        return
      }

      const isSuccess = saveTemplateJson(this.$refs.filterComponent.filter, templateId)

      if (isSuccess) {
        this.loadAllTemplates()
      }
    },

    loadTemplate() {
      const templateId = prompt(
        "Enter template ID (e.g., 'high-achievers'):"
      )
      if (!templateId) {
        return
      }

      const result = loadTemplateJson(templateId)
      if (result.success) {
        this.saveToHistory()
        this.$refs.filterComponent.filter = result.template
        
        let newUrl = `${this.baseUrl}/?template=${templateId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    },

    loadTemplateById(templateId) {
     const result = loadTemplateJson(templateId)
      if (result.success) {
        this.saveToHistory()
        this.$refs.filterComponent.filter = result.template
        let newUrl = `${this.baseUrl}/?template=${templateId}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      } else {
        alert('Template not found')
      }
    },

    loadAllTemplates() {
      const templatesFetch = listTemplates()
      if( templatesFetch.success ) {
        this.templates = templatesFetch.template
      }
    },

    generateShareUrl(id) {
      return `${this.baseUrl}/?template=${id}`;
    },

  },
  mounted() {
    this.baseUrl = window.location.origin
    this.currentFilter = this.$refs.filterComponent.filter

    this.hasSavedFilterInStorage = !!localStorage.getItem('savedFilter')

    this.loadAllTemplates()

    const params = new URLSearchParams(window.location.search)
    const templateId = params.get('template')

    if(templateId) {
      const result = loadTemplateJson(templateId)

      if (result.success) {
        this.$refs.filterComponent.filter = result.template
        this.currentFilter = result.template
      }

    }
  }
}
</script>

<template>
  <div>
    <header>
      <h1>Advanced Filter</h1>
      <button @click="saveFilter()" :disabled="!this.hasFilters">Save Filter</button>
      <button @click="loadFilter()" :disabled="!this.hasSavedFilter">Load Filter</button>
      <button @click="resetFilters()" :disabled="!this.hasFilters">Reset Filter</button>
      <button @click="undo()" :disabled="!this.canUndo">Undo</button>
      <button @click="redo()" :disabled="!this.canRedo">Redo</button>
      <button @click="saveTemplate()" :disabled="!this.hasFilters">Save Template</button>
      <button @click="loadTemplate()" :disabled="!this.hasTemplates">Load Specific Template</button>
    </header>

    <VueVisualFilter
      ref="filterComponent"
      :filtering-options="filteringOptions"
      @before-change="handleBeforeChange"
      @filter-update="captureFilterUpdate"
    />
  </div>
  <div>
    <h1>Availabel Templates</h1>
    
    <div v-if="!templates || templates.length === 0">
      <p>No templates saved yet.</p>
    </div>

    <div v-else>
      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 15%;">ID</th>
            <th style="width: 20%;">Created</th>
            <th style="width: 15%;">Actions</th>
            <th style="width: 45%;">Share URL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, index) in templates" :key="t.id || index">
            <td>{{ index + 1 }}</td>
            <td>{{ t.id }}</td>
            <td>{{ new Date(t.createdAt).toLocaleString() }}</td>
            <td>
              <button @click="loadTemplateById(t.id)">Load</button>
            </td>
            <td>
              <input
                type="text"
                readonly
                editable=false
                :value="generateShareUrl(t.id)"
                @click="$event.target.select()"
                style="width: 100%;"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 15px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e1e1e1;
    margin-bottom: 20px;
  }

  button:disabled {
    background-color: #cccccc;
    color: #666666;
    cursor: not-allowed;
    opacity: 0.6;
  }

  button:disabled:hover {
    background-color: #cccccc;
    transform: none;
  }

  header h1 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: #333;
  }

  button {
    background-color: #007bff;
    color: #fff;
    font-size: 14px;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.2s;
    width: 100%;
  }

  button:hover {
    background-color: #0056b3;
  }

  button:active {
    transform: scale(0.97);
  }

  button + button {
    margin-left: 8px;
  }

  @media (max-width: 600px) {
    header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    button + button {
      margin-left: 0;
    }
  }
</style>
