#include <stdio.h>
#include <stdlib.h>
#include "expenses.h"

int main()
{
    // Struct variable
    Expense expense;
    int choice;
    do
    {
        printf("\n\n1. Add Expense\n");
        printf("2. List All Expenses\n");
        printf("3. Filter Expenses\n");
        printf("4. Exit\n");

        printf("\nWhat do you want to do? [1 to 4]: ");
        scanf("%i", &choice);

        switch (choice)
        {
        case 1:
            add_expense(&expense);
            write(expense);
            break;

        case 2:
            list_expenses();
            break;

        case 3:
            printf("\nHow do you want to filter?\n");
            printf("\n1. Filter by Category\n");
            printf("2. Filter by Date\n");

            printf("\n[1|2]: ");
            int filter_opt;
            scanf("%i", &filter_opt);

            switch (filter_opt)
            {
            case 1:
                filter_by_cat();
                break;

            case 2:
                filter_by_date();
                break;

            default:
                break;
            }
            break;

        case 4:
            return 0;
        default:
            break;
        }
    } while (choice != 3);
}