#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include "expenses.h"
#include "incomes.h"

int main()
{
    // Structs variables
    Expense expense;
    Income income;
    char filter_category[MAX_CHAR];
    char filter_date[MAX_CHAR];
    char month_to_sum[MAX_DATE];
    int choice;
    int filter_opt;
    do
    {
        printf("\n\n1. Add Expense\n");
        printf("2. List All Expenses\n");
        printf("3. Filter Expenses\n");
        printf("4. See Month Totals\n");
        printf("5. Add Income\n");
        printf("6. See Total Income\n");
        printf("0. Exit\n");

        printf("\nWhat do you want to do? [0 to 6]: ");
        scanf("%i", &choice);
        while(getchar() != '\n' && getchar() != EOF);

        switch (choice)
        {
        case 1:
            add_expense(&expense);
            write_expense(expense);
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
            }//inner switch case end
            break;
        
        case 4:
            printf("\nWhat month/year do you want totals for? [MM/YY]: ");
            if (fgets(month_to_sum, sizeof(month_to_sum), stdin) != NULL){
                month_to_sum[strcspn(month_to_sum, "\n")] = '\0';
            }

            expenses_sum(month_to_sum);
            break;

        case 5:
            add_income(&income);
            write_income(&income);
            break;
        
        case 6:
            // total_income();
            break;

        case 0:
            return 0;

        default:
            break;

        }//switch case end

    } while (choice != 0);
}