#include <stdio.h>
#include <stdlib.h>
#include "expenses.h"

int main()
{
    int choice;
    do
    {
        printf("1. Add Expense\n");
        printf("2. List All Expenses\n");
        printf("3. Exit\n");

        printf("\nWhat do you want to do? [1 to 3]:");
        scanf("%i", &choice);

        switch (choice)
        {
        case 1:
            add_expense();
            break;
        case 2:
            list_expenses();
            break;
        case 3:
            return 0;
        default:
            break;
        }
    } while (choice != 3);
}