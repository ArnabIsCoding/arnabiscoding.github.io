// Package declaration to organize the project files.
package com.oop.store;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

// =======================================================================================
// ABSTRACTION (Interface): Defining a contract for downloadable items.
// An interface is a pure form of abstraction. It defines a "can-do" relationship.
// Any class that implements Downloadable MUST provide an implementation for the download() method.
// This allows unrelated classes to share a common behavior.
// =======================================================================================
interface Downloadable {
    /**
     * A contract method that must be implemented by any class representing a downloadable product.
     * It simulates the action of downloading the item.
     */
    void download();

    /**
     * Interfaces can also have default methods (with implementation) since Java 8.
     * This provides common functionality to all implementing classes without forcing them to implement it.
     */
    default void checkNetworkStatus() {
        System.out.println("Checking network connection... Connection is stable.");
    }
}

// =======================================================================================
// ABSTRACTION (Abstract Class) & ENCAPSULATION: The base class for all media items.
//
// ABSTRACTION: This class is 'abstract' because it represents a general concept ('Media Item')
// that is too generic to be instantiated directly. You can't sell a generic "media item";
// you sell a specific 'Book' or 'Movie'. It defines a common structure and behavior for all subclasses.
//
// ENCAPSULATION: The fields 'id', 'title', and 'price' are declared 'private'.
// This is data hiding. It protects the object's internal state from direct, uncontrolled access.
// Access is provided only through public 'getter' methods.
// =======================================================================================
abstract class MediaItem {
    private static int nextId = 1; // A static field to auto-generate unique IDs for items.
    private final int id;
    private String title;
    private double price;

    /**
     * Constructor for MediaItem. It's 'protected' so that only subclasses can call it.
     * It initializes the common properties of all media items.
     * @param title The title of the media item.
     * @param price The price of the media item.
     */
    protected MediaItem(String title, double price) {
        this.id = nextId++;
        this.title = title;
        // ENCAPSULATION IN ACTION: Applying validation logic within the constructor/setter.
        if (price >= 0) {
            this.price = price;
        } else {
            this.price = 0.0; // Default to 0 if an invalid price is provided.
            System.out.println("Warning: Price cannot be negative. Set to 0.0 for " + title);
        }
    }

    // --- Public Getter Methods (Encapsulation) ---
    // These methods provide controlled, read-only access to the private fields.
    public int getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public double getPrice() {
        return price;
    }

    // --- Abstract Method (Abstraction) ---
    /**
     * This is an abstract method. It has no implementation here in the base class.
     * It defines a contract: any concrete (non-abstract) subclass of MediaItem MUST
     * provide its own implementation for this method. This ensures all items can display their details.
     * @return A string containing the specific details of the media item.
     */
    public abstract String getDetails();
}

// =======================================================================================
// INHERITANCE: The Book class extends MediaItem.
// 'Book' is a subclass of 'MediaItem'. It inherits all non-private fields and methods
// from MediaItem (like id, title, price, and their getters). This promotes code reuse.
// =======================================================================================
class Book extends MediaItem {
    // Additional field specific to Book.
    private String author;

    /**
     * Constructor for the Book class.
     * @param title The title of the book.
     * @param price The price of the book.
     * @param author The author of the book.
     */
    public Book(String title, double price, String author) {
        // INHERITANCE IN ACTION: The 'super()' keyword calls the constructor of the parent class (MediaItem).
        // This is necessary to initialize the inherited fields (title, price).
        // It must be the first statement in the constructor.
        super(title, price);
        this.author = author;
    }

    // Getter for the author field.
    public String getAuthor() {
        return author;
    }

    // --- POLYMORPHISM (Method Overriding) ---
    /**
     * This method overrides the abstract 'getDetails()' method from the MediaItem superclass.
     * It provides a specific implementation for Books. When getDetails() is called on a MediaItem
     * reference that points to a Book object, this version of the method will be executed at runtime.
     * @return A formatted string with book details.
     */
    @Override
    public String getDetails() {
        return String.format("ID: %d, Book: '%s' by %s, Price: $%.2f", getId(), getTitle(), this.author, getPrice());
    }
}

// =======================================================================================
// INHERITANCE: The Movie class also extends MediaItem.
// Like Book, 'Movie' is a subclass of 'MediaItem' and inherits its common features.
// =======================================================================================
class Movie extends MediaItem {
    // Additional field specific to Movie.
    private String director;
    private int runtimeMinutes;

    /**
     * Constructor for the Movie class.
     * @param title The title of the movie.
     * @param price The price of the movie.
     * @param director The director of the movie.
     * @param runtimeMinutes The runtime of the movie in minutes.
     */
    public Movie(String title, double price, String director, int runtimeMinutes) {
        // Calling the superclass constructor to initialize inherited fields.
        super(title, price);
        this.director = director;
        this.runtimeMinutes = runtimeMinutes;
    }

    // --- POLYMORPHISM (Method Overriding) ---
    /**
     * This method overrides the abstract 'getDetails()' method from MediaItem.
     * It provides a specific implementation for Movies. This is another example of runtime polymorphism.
     * @return A formatted string with movie details.
     */
    @Override
    public String getDetails() {
        return String.format("ID: %d, Movie: '%s' directed by %s, Runtime: %d mins, Price: $%.2f", getId(), getTitle(), this.director, this.runtimeMinutes, getPrice());
    }
}

// =======================================================================================
// INHERITANCE & INTERFACE IMPLEMENTATION: EBook class.
// EBook inherits from Book (getting all Book features) and also implements the Downloadable interface.
// This demonstrates that a class can extend one class and implement multiple interfaces.
// It represents an "is-a" relationship (EBook is a Book) and a "can-do" relationship (EBook can be downloaded).
// =======================================================================================
class EBook extends Book implements Downloadable {
    private double fileSizeMB;

    /**
     * Constructor for the EBook class.
     * @param title The title of the eBook.
     * @param price The price of the eBook.
     * @param author The author of the eBook.
     * @param fileSizeMB The file size in megabytes.
     */
    public EBook(String title, double price, String author, double fileSizeMB) {
        super(title, price, author);
        this.fileSizeMB = fileSizeMB;
    }

    // --- INTERFACE METHOD IMPLEMENTATION ---
    /**
     * This method fulfills the contract of the 'Downloadable' interface.
     * Any class implementing Downloadable must have this method.
     */
    @Override
    public void download() {
        // We can call the default method from the interface.
        checkNetworkStatus();
        System.out.printf("Downloading '%s' (%.2f MB)... Download complete.\n", getTitle(), this.fileSizeMB);
    }

    // --- POLYMORPHISM (Method Overriding) ---
    /**
     * EBook also overrides getDetails() to include its specific information.
     * This demonstrates a multi-level hierarchy of method overriding (MediaItem -> Book -> EBook).
     * @return A formatted string with eBook details.
     */
    @Override
    public String getDetails() {
        return String.format("ID: %d, EBook: '%s' by %s, File Size: %.2f MB, Price: $%.2f", getId(), getTitle(), getAuthor(), this.fileSizeMB, getPrice());
    }
}

// =======================================================================================
// CLASS demonstrating POLYMORPHISM.
// The ShoppingCart class manages a collection of MediaItem objects.
// =======================================================================================
class ShoppingCart {
    // --- POLYMORPHISM IN ACTION ---
    // This list is declared to hold 'MediaItem' objects. However, it can hold any object
    // of a class that is a subclass of MediaItem (e.g., Book, Movie, EBook).
    // This is the power of polymorphism.
    private List<MediaItem> items = new ArrayList<>();

    /**
     * Adds an item to the shopping cart.
     * The parameter is of type MediaItem, so it can accept any subclass object.
     * @param item The MediaItem (or its subclass) to add.
     */
    public void addItem(MediaItem item) {
        items.add(item);
        System.out.println("Added to cart: " + item.getTitle());
    }

    /**
     * Calculates the total price of all items in the cart.
     * It iterates through the list and calls getPrice() on each item.
     * Polymorphism ensures the correct price is retrieved regardless of the object's specific type.
     * @return The total price of all items.
     */
    public double getTotalPrice() {
        double total = 0.0;
        for (MediaItem item : items) {
            total += item.getPrice();
        }
        return total;
    }

    /**
     * Displays the details of all items in the cart.
     * This is the most explicit demonstration of RUNTIME POLYMORPHISM.
     * When 'item.getDetails()' is called, the JVM checks the actual type of the object
     * at runtime (is it a Book? a Movie? an EBook?) and calls the correctly
     * overridden version of the method.
     */
    public void displayCartContents() {
        if (items.isEmpty()) {
            System.out.println("Your shopping cart is empty.");
            return;
        }
        System.out.println("\n--- Shopping Cart Contents ---");
        for (MediaItem item : items) {
            // DYNAMIC METHOD DISPATCH: The correct getDetails() is called here at runtime.
            System.out.println(item.getDetails());
        }
        System.out.printf("------------------------------\nTotal Price: $%.2f\n", getTotalPrice());
    }
}

// =======================================================================================
// CLASS demonstrating COMPILE-TIME POLYMORPHISM (Method Overloading).
// The Store class manages the inventory of media items.
// =======================================================================================
class Store {
    private List<MediaItem> inventory = new ArrayList<>();

    /**
     * Adds an item to the store's inventory.
     * @param item The item to add.
     */
    public void addItemToInventory(MediaItem item) {
        inventory.add(item);
    }

    /**
     * Displays all items available in the store's inventory.
     */
    public void displayInventory() {
        System.out.println("\n--- Available Items in Store ---");
        for (MediaItem item : inventory) {
            System.out.println(item.getDetails());
        }
        System.out.println("--------------------------------");
    }

    /**
     * Finds an item in the inventory by its ID.
     * @param id The ID of the item to find.
     * @return The MediaItem if found, otherwise null.
     */
    public MediaItem findItemById(int id) {
        for (MediaItem item : inventory) {
            if (item.getId() == id) {
                return item;
            }
        }
        return null;
    }

    // --- COMPILE-TIME POLYMORPHISM (Method Overloading) ---
    // Here we have two methods named 'search'. The compiler can distinguish them
    // at compile-time based on their different parameter lists.

    /**
     * Overloaded search method: Searches for items by title.
     * @param title The title to search for.
     * @return A list of matching items.
     */
    public List<MediaItem> search(String title) {
        List<MediaItem> results = new ArrayList<>();
        for (MediaItem item : inventory) {
            if (item.getTitle().equalsIgnoreCase(title)) {
                results.add(item);
            }
        }
        return results;
    }

    /**
     * Overloaded search method: Searches for books by title AND author.
     * This method has a different signature (two String parameters).
     * @param title The title to search for.
     * @param author The author to search for.
     * @return A list of matching books.
     */
    public List<MediaItem> search(String title, String author) {
        List<MediaItem> results = new ArrayList<>();
        for (MediaItem item : inventory) {
            // We must check if the item is a Book before trying to get its author.
            // The 'instanceof' operator is used for this type checking.
            if (item instanceof Book) {
                Book book = (Book) item; // This is called downcasting.
                if (book.getTitle().equalsIgnoreCase(title) && book.getAuthor().equalsIgnoreCase(author)) {
                    results.add(book);
                }
            }
        }
        return results;
    }
}

// =======================================================================================
// The Main class: The entry point of the application.
// This class contains the main() method and drives the user interaction.
// It demonstrates the creation of OBJECTS and their interactions.
// =======================================================================================
public class Main {
    public static void main(String args) {
        // --- OBJECT CREATION ---
        // Here we are creating instances (objects) of our classes.
        Store myStore = new Store();
        ShoppingCart myCart = new ShoppingCart();
        Scanner scanner = new Scanner(System.in);

        // Populate the store's inventory with some objects.
        myStore.addItemToInventory(new Book("The Lord of the Rings", 25.99, "J.R.R. Tolkien"));
        myStore.addItemToInventory(new Movie("Inception", 15.50, "Christopher Nolan", 148));
        myStore.addItemToInventory(new Book("Dune", 22.75, "Frank Herbert"));
        myStore.addItemToInventory(new EBook("A Brief History of Time", 12.99, "Stephen Hawking", 5.2));
        myStore.addItemToInventory(new Movie("The Matrix", 14.99, "Wachowskis", 136));

        // Main application loop
        boolean running = true;
        while (running) {
            System.out.println("\nWelcome to the OOP Media Store!");
            System.out.println("1. View all items");
            System.out.println("2. Add item to cart by ID");
            System.out.println("3. View shopping cart");
            System.out.println("4. Download an item (if possible)");
            System.out.println("5. Exit");
            System.out.print("Please choose an option: ");

            int choice = scanner.nextInt();
            scanner.nextLine(); // Consume newline

            switch (choice) {
                case 1:
                    myStore.displayInventory();
                    break;
                case 2:
                    System.out.print("Enter the ID of the item to add to cart: ");
                    int idToAdd = scanner.nextInt();
                    MediaItem itemToAdd = myStore.findItemById(idToAdd);
                    if (itemToAdd!= null) {
                        myCart.addItem(itemToAdd);
                    } else {
                        System.out.println("Item with ID " + idToAdd + " not found.");
                    }
                    break;
                case 3:
                    myCart.displayCartContents();
                    break;
                case 4:
                    System.out.print("Enter the ID of the item to download: ");
                    int idToDownload = scanner.nextInt();
                    MediaItem itemToDownload = myStore.findItemById(idToDownload);
                    // Using 'instanceof' to check if the item implements the Downloadable interface.
                    if (itemToDownload instanceof Downloadable) {
                        // We must cast the object to the interface type to call its methods.
                        Downloadable downloadableItem = (Downloadable) itemToDownload;
                        downloadableItem.download();
                    } else if (itemToDownload!= null) {
                        System.out.println("Sorry, '" + itemToDownload.getTitle() + "' is not a downloadable item.");
                    } else {
                        System.out.println("Item with ID " + idToDownload + " not found.");
                    }
                    break;
                case 5:
                    running = false;
                    System.out.println("Thank you for visiting. Goodbye!");
                    break;
                default:
                    System.out.println("Invalid option. Please try again.");
            }
        }
        scanner.close();
    }
}
