#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include "expenses.h"

int main()
{
    // Struct variable
    Expense expense;
    char filter_category[MAX_CHAR];
    char filter_date[MAX_CHAR];
    int choice;
    int filter_opt;
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
            scanf("%i", &filter_opt);
            while(getchar() != '\n' && getchar() != EOF);

            switch (filter_opt)
            {
            case 1:

                printf("\nCategory you want to filter: ");
                if(fgets(filter_category, sizeof(filter_category), stdin) != NULL){
                    filter_category[strcspn(filter_category, "\n")] = '\0';
                }

                filter_by_cat(filter_category);
                break;

            case 2:

                printf("\nDate you want to filter: ");
                if (fgets(filter_date, sizeof(filter_date), stdin) != NULL){
                    filter_date[strcspn(filter_date, "\n")] = '\0';
                }

                filter_by_date(filter_date);
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
    } while (choice != 4);
}