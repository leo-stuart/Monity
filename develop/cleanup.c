#include "cleanup.h"
#include "incomes.h"
#include "expenses.h"
#include <ctype.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

Expense expense;
Income income;

int delete_expense(char keyword[])
{
    char *expense_filename = "expenses.txt";
    FILE *expense_file = fopen(expense_filename, "r");
    if (expense_file == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", expense_filename);
        return 1;
    }

    char line[256];
    char matches[100][256];
    int appears_count = 0, length, delete_choice;
    while (fgets(line, sizeof(line), expense_file))
    {
        char *desc = strtok(line, ",");
        if (desc == NULL)
            continue;

        char *amount = strtok(NULL, ",");
        if (amount == NULL)
            continue;

        char *cat = strtok(NULL, ",");
        if (cat == NULL)
            continue;

        char *data = strtok(NULL, ",");
        if (data == NULL)
            continue;

        char *appears_desc = strstr(desc, keyword);
        char *appears_cat = strstr(cat, keyword);

        if (appears_cat != NULL || appears_desc != NULL)
        {
            printf("[%i] %s,%s,%s,%s", appears_count, desc, amount, cat, data);

            snprintf(matches[appears_count], sizeof(matches[appears_count]), "%s,%s,%s,%s", desc, amount, cat, data);

            appears_count += 1;
        }
    }

    if (appears_count >= 1)
    {
        printf("Which entry do you want to delete? [0 to %i]: ", appears_count);
        scanf("%i", &delete_choice);
        while (getchar() != '\n' && getchar() != EOF)
            ;
    }
    fclose(expense_file);

    char *expense_temp_file = "expenses_temp.txt";
    FILE *expenses_temp = fopen(expense_temp_file, "w");
    if (expenses_temp == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", expense_temp_file);
        return 1;
    }

    expense_file = fopen(expense_filename, "r");

    while (fgets(line, sizeof(line), expense_file))
    {
        line[strcspn(line, "\n")] = '\0';
        if (strcmp(line, matches[delete_choice]) == 0)
        {
            continue;
        }
        else
        {
            fprintf(expenses_temp, "%s\n", line);
        }
    }

    fclose(expenses_temp);
    fclose(expense_file);
    remove("expenses.txt");
    rename("expenses_temp.txt", "expenses.txt");
    printf("\n✅ Entry deleted successfully!\n");
    return 0;
}

int delete_income(char keyword[])
{
    char *incomes_filename = "incomes.txt";
    FILE *incomes_file = fopen(incomes_filename, "r");
    if (incomes_file == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", incomes_filename);
        return 1;
    }

    char line[256];
    char matches[100][256];
    int appears_count = 0, length, delete_choice;
    while (fgets(line, sizeof(line), incomes_file))
    {
        char *cat = strtok(line, ",");
        if (cat == NULL)
            continue;

        char *amount = strtok(NULL, ",");
        if (amount == NULL)
            continue;

        char *data = strtok(NULL, ",");
        if (data == NULL)
            continue;

        char *appears_cat = strstr(cat, keyword);

        if (appears_cat != NULL)
        {
            printf("[%i] %s,%s,%s", appears_count, cat, amount, data);

            snprintf(matches[appears_count], sizeof(matches[appears_count]), "%s,%s,%s", cat, amount, data);

            appears_count += 1;
        }
    }

    if (appears_count >= 1)
    {
        printf("Which entry do you want to delete? [0 to %i]: ", appears_count);
        scanf("%i", &delete_choice);
        while (getchar() != '\n' && getchar() != EOF)
            ;
    }
    fclose(incomes_file);

    char *incomes_temp_file = "incomes_temp.txt";
    FILE *incomes_temp = fopen(incomes_temp_file, "w");
    if (incomes_temp == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", incomes_temp_file);
        return 1;
    }

    incomes_file = fopen(incomes_filename, "r");

    while (fgets(line, sizeof(line), incomes_file))
    {
        line[strcspn(line, "\n")] = '\0';
        if (strcmp(line, matches[delete_choice]) == 0)
        {
            continue;
        }
        else
        {
            fprintf(incomes_file, "%s\n", line);
        }
    }

    fclose(incomes_temp);
    fclose(incomes_file);
    remove("incomes.txt");
    rename("incomes_temp.txt", "incomes.txt");
    printf("\n✅ Entry deleted successfully!\n");
    return 0;
}

int edit_expense(char keyword[])
{
    char *expense_filename = "expenses.txt";
    FILE *expense_file = fopen(expense_filename, "r");
    if (expense_file == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", expense_filename);
        return 1;
    }

    char line[256];
    char matches[100][256];
    int appears_count = 0, length, delete_choice;
    while (fgets(line, sizeof(line), expense_file))
    {
        char *desc = strtok(line, ",");
        if (desc == NULL)
            continue;

        char *amount = strtok(NULL, ",");
        if (amount == NULL)
            continue;

        char *cat = strtok(NULL, ",");
        if (cat == NULL)
            continue;

        char *data = strtok(NULL, ",");
        if (data == NULL)
            continue;

        char *appears_desc = strstr(desc, keyword);
        char *appears_cat = strstr(cat, keyword);

        if (appears_cat != NULL || appears_desc != NULL)
        {
            printf("[%i] %s,%s,%s,%s", appears_count, desc, amount, cat, data);

            snprintf(matches[appears_count], sizeof(matches[appears_count]), "%s,%s,%s,%s", desc, amount, cat, data);

            appears_count += 1;
        }
    }

    if (appears_count >= 1)
    {
        printf("Which entry do you want to edit? [0 to %i]: ", appears_count);
        scanf("%i", &delete_choice);
        while (getchar() != '\n' && getchar() != EOF)
            ;
    }
    fclose(expense_file);

    char *expense_temp_file = "expenses_temp.txt";
    FILE *expenses_temp = fopen(expense_temp_file, "w");
    if (expenses_temp == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", expense_temp_file);
        return 1;
    }

    expense_file = fopen(expense_filename, "r");

    while (fgets(line, sizeof(line), expense_file))
    {
        line[strcspn(line, "\n")] = '\0';
        if (strcmp(line, matches[delete_choice]) == 0)
        {
            add_expense(&expense);
            // write
            fprintf(expenses_temp, "%s,%.2f,%s,%s\n", expense.description, expense.amount, expense.category, expense.date);
        }
        else
        {
            fprintf(expenses_temp, "%s\n", line);
        }
    }

    fclose(expenses_temp);
    fclose(expense_file);
    remove("expenses.txt");
    rename("expenses_temp.txt", "expenses.txt");
    printf("\n✅ Entry edited successfully!\n");
    return 0;
}
int edit_income(char keyword[])
{
    char *incomes_filename = "incomes.txt";
    FILE *incomes_file = fopen(incomes_filename, "r");
    if (incomes_file == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", incomes_filename);
        return 1;
    }

    char line[256];
    char matches[100][256];
    int appears_count = 0, length, delete_choice;
    while (fgets(line, sizeof(line), incomes_file))
    {
        char *cat = strtok(line, ",");
        if (cat == NULL)
            continue;

        char *amount = strtok(NULL, ",");
        if (amount == NULL)
            continue;

        char *data = strtok(NULL, ",");
        if (data == NULL)
            continue;

        char *appears_cat = strstr(cat, keyword);

        if (appears_cat != NULL)
        {
            printf("[%i] %s,%s,%s", appears_count, cat, amount, data);

            snprintf(matches[appears_count], sizeof(matches[appears_count]), "%s,%s,%s", cat, amount, data);

            appears_count += 1;
        }
    }

    if (appears_count >= 1)
    {
        printf("Which entry do you want to delete? [0 to %i]: ", appears_count);
        scanf("%i", &delete_choice);
        while (getchar() != '\n' && getchar() != EOF)
            ;
    }
    fclose(incomes_file);

    char *incomes_temp_file = "incomes_temp.txt";
    FILE *incomes_temp = fopen(incomes_temp_file, "w");
    if (incomes_temp == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", incomes_temp_file);
        return 1;
    }

    incomes_file = fopen(incomes_filename, "r");

    while (fgets(line, sizeof(line), incomes_file))
    {
        line[strcspn(line, "\n")] = '\0';
        if (strcmp(line, matches[delete_choice]) == 0)
        {
            add_income(&income);
            fprintf(incomes_temp, "%s,%.2f,%s\n", income.category, income.amount, income.date);
        }
        else
        {
            fprintf(incomes_file, "%s\n", line);
        }
    }

    fclose(incomes_temp);
    fclose(incomes_file);
    remove("incomes.txt");
    rename("incomes_temp.txt", "incomes.txt");
    printf("\n✅ Entry edited successfully!\n");
    return 0;
}

void cleanup_menu()
{
    int choice;
    int file_choice;
    char keyword[MAX_CHAR];

    printf("=============================\n");
    printf("\n What do you want to do?\n");
    printf("=============================\n");
    printf("1. 🗑️ Delete an Entry\n");
    printf("2. 🔁 Edit an entry\n");
    printf("-----------------------------\n");
    printf("[1 to 2]:\n");
    scanf("%i", &choice);

    switch (choice)
    {
    case 1:
        printf("=============================\n");
        printf("    🗑️ Delete an Entry\n");
        printf("=============================\n");
        printf("1. 💸 Expense\n");
        printf("2. 💵 Income\n");
        printf("-----------------------------\n");
        printf("[1|2]: ");
        scanf("%i", &file_choice);
        while (getchar() != '\n' && getchar() != EOF)
            ;

        switch (file_choice)
        {
        case 1:
            printf("What keyword do you want to search? ");
            if (fgets(keyword, sizeof(keyword), stdin) != NULL)
            {
                keyword[strcspn(keyword, "\n")] = '\0';
            }
            delete_expense(keyword);
            break;

        case 2:
            printf("What keyword do you want to search? ");
            if (fgets(keyword, sizeof(keyword), stdin) != NULL)
            {
                keyword[strcspn(keyword, "\n")] = '\0';
            }
            delete_income(keyword);
            break;

        default:
            break;
        }

        break;
    // end case 1
    case 2:
        printf("=============================\n");
        printf("    🔁 Edit an Entry\n");
        printf("=============================\n");
        printf("1. 💸 Expense\n");
        printf("2. 💵 Income\n");
        printf("-----------------------------\n");
        printf("[1|2]: ");
        scanf("%i", &file_choice);
        while (getchar() != '\n' && getchar() != EOF)
            ;

        switch (file_choice)
        {
        case 1:
            printf("What keyword do you want to search? ");
            if (fgets(keyword, sizeof(keyword), stdin) != NULL)
            {
                keyword[strcspn(keyword, "\n")] = '\0';
            }
            edit_expense(keyword);
            break;

        case 2:
            printf("What keyword do you want to search? ");
            if (fgets(keyword, sizeof(keyword), stdin) != NULL)
            {
                keyword[strcspn(keyword, "\n")] = '\0';
            }
            edit_income(keyword);
            break;

        default:
            break;
        }
        break;

    default:
        break;
    }
}
