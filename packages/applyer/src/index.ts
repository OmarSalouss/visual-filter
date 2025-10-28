import { FilterType, GroupType } from "@visual-filter/common"

export = function applyFilter(filter: any, methods: any, data: any) {
  const require_two_argument = ["between"];

  function buildPremiseTree(filter: any) {
    if (filter.type === FilterType.CONDITION) {
      return data
        .find((field: any) => field.name === filter.fieldName)
        .values.map((value: any) => {
          try {
            if (require_two_argument.includes(filter.method)) {
              // now its for "between" method, pass cellValue + two arguments (argument1 & argument2)
              return methods[filter.dataType][filter.method](
                value,
                filter.argument1,
                filter.argument2,
              )
            } else {
              // for all other methods, pass cellValue + single argument
              return methods[filter.dataType][filter.method](
                value,
                filter.argument,
              )
            }
          } catch (error) {
            return false
          }
        })
    }
    return filter.filters.map((f: any) => buildPremiseTree(f))
  }

  function shouldntDeleteRow(rowIndex: any, premises: any, group: any) {
    for (
      let conditionIndex = 0;
      conditionIndex < premises.length;
      ++conditionIndex
    ) {
      const currentPremise =
        premises[conditionIndex][0]?.constructor === Array
          ? shouldntDeleteRow(
              rowIndex,
              premises[conditionIndex],
              group.filters[conditionIndex],
            )
          : premises[conditionIndex][rowIndex]

      if (currentPremise === true) {
        switch (group.groupType) {
          case GroupType.AND:
            continue
          case GroupType.NOT_AND:
            return false
          case GroupType.OR:
            return true
          case GroupType.NOT_OR:
            continue
        }
      } else {
        switch (group.groupType) {
          case GroupType.AND:
            return false
          case GroupType.NOT_AND:
            continue
          case GroupType.OR:
            continue
          case GroupType.NOT_OR:
            return true
        }
      }
    }

    switch (group.groupType) {
      case GroupType.AND:
      case GroupType.NOT_AND:
        return true
      case GroupType.OR:
      case GroupType.NOT_OR:
        return false
    }
  }

  const premiseTree = buildPremiseTree(filter)

  for (
    let rowIndex = 0, rowsCount = data[0].values.length, deletionCount = 0;
    rowIndex < rowsCount;
    ++rowIndex
  ) {
    if (shouldntDeleteRow(rowIndex, premiseTree, filter) === false) {
      data.forEach((field: any) =>
        field.values.splice(rowIndex - deletionCount, 1),
      )
      ++deletionCount
    }
  }

  return data
}
