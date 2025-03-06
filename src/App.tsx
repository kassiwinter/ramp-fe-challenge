import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)

  const loadAllTransactions = useCallback(async () => {
    if (employees === null) {                     // Only set employee loading if employees aren't loaded yet
      setIsEmployeesLoading(true)
    }
    
    transactionsByEmployeeUtils.invalidateData()

    if (employees === null) {                    // If employees need to be loaded, do that first
      await employeeUtils.fetchAll()
      setIsEmployeesLoading(false)
    }

    await paginatedTransactionsUtils.fetchAll() // Loading transactions doesn't affect employee dropdown
    
}, [employees, employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      if (employeeId === EMPTY_EMPLOYEE.id) {
        await loadAllTransactions();    
      } else {                           
        await transactionsByEmployeeUtils.fetchById(employeeId);
      }
  
      },
      [paginatedTransactionsUtils, transactionsByEmployeeUtils, loadAllTransactions]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }

            await loadTransactionsByEmployee(newValue.id)
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions !== null && 
            paginatedTransactions !== null && 
            paginatedTransactions.nextPage !== null &&(
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await paginatedTransactionsUtils.fetchAll()
              }}
            >
              View More
            </button> 
          )}
        </div>
      </main>
    </Fragment>
  )
}
