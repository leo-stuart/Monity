#include "expenses.h"
#include "shared.h"
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <stdio.h>

int write_expense(Expense expense)
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "a");
    if (outfile == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", outgoings);
        return 1;
    }
    fprintf(outfile, "%s,%.2f,%s,%s\n", expense.description, expense.amount, expense.category, expense.date);

    fclose(outfile);

    printf("\n✅ Expense added succesfully!\n");

    return 0;
}

void add_expense(Expense *expense)
{
    char temp[MAX_CHAR];

    int clear;
    while ((clear = getchar()) != '\n' && clear != EOF);

    printf("\n📌 Expense short description: ");
    if (fgets(expense->description, sizeof(expense->description), stdin) != NULL)
    {
        expense->description[strcspn(expense->description, "\n")] = '\0';
    }

    printf("\n💰 How much did you spend: ");
    if (fgets(temp, sizeof(temp), stdin) != NULL)
    {
        expense->amount = atof(temp);
    }

    printf("\n🍽️ Expense category: ");
    if (fgets(expense->category, sizeof(expense->category), stdin) != NULL)
    {
        expense->category[strcspn(expense->category, "\n")] = '\0';
    }

    printf("\n🗓️ When did you bought it [DD/MM/YY]: ");
    if (fgets(expense->date, sizeof(expense->date), stdin) != NULL)
    {
        expense->date[strcspn(expense->date, "\n")] = '\0';
    }
}

int list_expenses()
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "r");
    if (outfile == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", outgoings);
        return 1;
    }

    // buffer
    char line[256];
    if(!is_api_mode){
        printf("\n📌 Description   💸 Amount     🍽️  Category     🗓️  Date\n");
        printf("--------------------------------------------------------\n");
        while (fgets(line, sizeof(line), outfile))
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
    
            printf("%-15s $%-10s %-18s %-10s\n", desc, amount, cat, data);
        }
    } else {
        while (fgets(line, sizeof(line), outfile))
        {
            line[strcspn(line, "\n")] = '\0';
            printf("%s\n", line);
        }
    }

    fclose(outfile);

    return 0;
}

int filter_by_cat(char filter_category[])
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "r");
    if (outfile == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", outgoings);
        return 1;
    }

    // buffer
    char line[256];
    float total = 0;
    printf("\n📌 Description   💸 Amount     🍽️  Category     🗓️  Date\n");
    printf("--------------------------------------------------------\n");
    while (fgets(line, sizeof(line), outfile))
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

        if (strcmp(cat, filter_category) == 0)
        {
            printf("%-15s $%-10s %-18s %-10s\n", desc, amount, cat, data);
            float amount_int = atof(amount);
            total += amount_int;
        }
    }
    printf("--------------------------------------------------------\n");
    printf("Total spent in category %s: $%.2f\n", filter_category, total);
    printf("--------------------------------------------------------\n");


    fclose(outfile);

    return 0;
}

int filter_by_date(char filter_date[])
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "r");
    if (outfile == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", outgoings);
        return 1;
    }

    // buffer
    char line[256];
    float total = 0;
    printf("\n📌 Description   💸 Amount     🍽️  Category     🗓️  Date\n");
    printf("--------------------------------------------------------\n");
    while (fgets(line, sizeof(line), outfile))
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

        if (strcmp(data, filter_date) == 0)
        {
            printf("%-15s $%-10s %-18s %-10s\n", desc, amount, cat, data);
            float amount_int = atof(amount);
            total += amount_int;
        }
    }
    printf("--------------------------------------------------------\n");
    printf("Total spent in date %s: $%.2f\n", filter_date, total);
    printf("--------------------------------------------------------\n");

    fclose(outfile);

    return 0;
}

float expenses_sum(char month_to_sum[]){
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "r");
    if (outfile == NULL)
    {
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", outgoings);
        return 1;
    }

    // buffer
    char line[256];
    float total = 0;
    while (fgets(line, sizeof(line), outfile))
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

        char *appears = strstr(data, month_to_sum);
        
        if(appears != NULL){
            float amount_int = atof(amount);
            total += amount_int;
        }

    }
    
    fclose(outfile);

    return total;
}
