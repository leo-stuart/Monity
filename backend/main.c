#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <stdbool.h>
#include "shared.h"
#include "expenses.h"
#include "incomes.h"
#include "cleanup.h"

int main(int argc, char *argv[])
{
    // Structs variables
    bool is_api_mode = false;
    Expense expense;
    Income income;
    char filter_category[MAX_CHAR];
    char filter_date[MAX_CHAR];
    char month_to_sum[MAX_DATE];
    int choice;
    int filter_opt;

    if(argc > 1){
        is_api_mode = true;
        //api mode
        if(strcmp(argv[1], "add-expense") == 0){
            if(argc != 6){
                printf("Error: Not enough args\n");
                return 2;
            } else {
                strcpy(expense.description, argv[2]);
                expense.amount = atof(argv[3]);
                strcpy(expense.category, argv[4]);
                strcpy(expense.date, argv[5]);
                write_expense(expense);
            }
        } else if(strcmp(argv[1], "add-income") == 0){
            if(argc != 5){
                printf("Error: Not enough args\n");
                return 2;
            } else {
                strcpy(income.category, argv[2]);
                income.amount = atof(argv[3]);
                strcpy(income.date, argv[4]);
                write_income(&income);
            }
        } else if(strcmp(argv[1], "list-expenses") == 0){
            if(argc != 2){
                printf("Error: Not enough args\n");
                return 2;
            } else {
                list_expenses();
            }
        } else if(strcmp(argv[1], "list-incomes") == 0){

        } else if(strcmp(argv[1], "total-expenses") == 0){

        }else if(strcmp(argv[1], "balance") == 0){
            
        }
    } else {
        //terminal mode
        do
        {
            system("clear");
            printf("=============================\n");
            printf("      🧾 Monity Tracker\n");
            printf("=============================\n");
            printf("1. ➕ Add Expense\n");
            printf("2. 📋 List All Expenses\n");
            printf("3. 🔍 Filter Expenses\n");
            printf("4. 📆 Show Month Totals\n");
            printf("5. 💰 Add Income\n");
            printf("6. 💵 Show Total Income\n");
            printf("7. 💼 Show Month Balance\n");
            printf("8. 📊 Show Monthly History\n");
            printf("9. 🧹 CleanUp Options\n");
            printf("0. ❌ Exit\n");
            printf("-----------------------------\n");
    
            printf("\nWhat do you want to do? [0 to 9]: ");
            scanf("%i", &choice);
            while (getchar() != '\n' && getchar() != EOF);
    
            switch (choice)
            {
            case 0:
                return 0;
            case 1:
                add_expense(&expense);
                write_expense(expense);
                while(getchar() != '\n' && getchar() != EOF);
    
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            case 2:
                printf("\n📋 Here are all your expenses:\n");
                list_expenses();
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            case 3:
                printf("=============================\n");
                printf("\n How do you want to filter?\n");
                printf("=============================\n");
                printf("1. 📌 Filter by Category\n");
                printf("2. 🗓️ Filter by Date\n");
                printf("-----------------------------\n");
    
                printf("\n[1|2]: ");
                scanf("%i", &filter_opt);
                while (getchar() != '\n' && getchar() != EOF);
    
                switch (filter_opt)
                {
                case 1:
    
                    printf("\n📌 Category you want to filter: ");
                    if (fgets(filter_category, sizeof(filter_category), stdin) != NULL)
                    {
                        filter_category[strcspn(filter_category, "\n")] = '\0';
                    }
    
                    printf("\n🔍 Showing expenses for category: %s\n", filter_category);
                    filter_by_cat(filter_category);
                    break;
                    
                    case 2:
                    
                    printf("\n🗓️ Date you want to filter: ");
                    if (fgets(filter_date, sizeof(filter_date), stdin) != NULL)
                    {
                        filter_date[strcspn(filter_date, "\n")] = '\0';
                    }
                    
                    printf("\n🔍 Showing expenses for date: %s\n", filter_date);
                    filter_by_date(filter_date);
                    break;
    
                    default:
                        break;
                } // inner switch case end
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            case 4:
                printf("\nWhat month/year do you want totals expenses for? [MM/YY]: ");
                if (fgets(month_to_sum, sizeof(month_to_sum), stdin) != NULL)
                {
                    month_to_sum[strcspn(month_to_sum, "\n")] = '\0';
                }
    
                float total = expenses_sum(month_to_sum);
                printf("\n💸 Total spent in %s: %.2f\n", month_to_sum, total);
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            case 5:
                add_income(&income);
                write_income(&income);
                while(getchar() != '\n' && getchar() != EOF);
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            case 6:
                printf("\nWhat month do you want totals incomes for? [MM/YY]: ");
                if (fgets(month_to_sum, sizeof(month_to_sum), stdin) != NULL)
                {
                    month_to_sum[strcspn(month_to_sum, "\n")] = '\0';
                }
                float total_income_variable = total_income(month_to_sum);
                printf("\n💰 Total income for %s: %.2f\n", month_to_sum, total_income_variable);
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            case 7:
                printf("\nWhat month do you want balance for? [MM/YY]: ");
                if(fgets(month_to_sum, sizeof(month_to_sum), stdin) != NULL){
                    month_to_sum[strcspn(month_to_sum, "\n")] = '\0';
                }
    
                float balance = total_income(month_to_sum) - expenses_sum(month_to_sum);
                printf("\n🤑 Your balance in %s: $%.2f\n", month_to_sum, balance);
                printf("\nPress Enter to return to the menu...");
                getchar();
                
                break;
                
            case 8:
                printf("=============================\n");
                printf("     📆 Monthly Summary\n");
                printf("=============================\n");
                monthly_history();
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            case 9:
                cleanup_menu();
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            default:
                printf("\n❌ Invalid option. Please choose between 0 and 7.\n");
                printf("\nPress Enter to return to the menu...");
                getchar();
                break;
    
            } // switch case end
        } while (choice != 0);
    }
}