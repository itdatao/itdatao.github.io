---
title: effective Java
tags: Java
abbrlink: 21283aa4
date: 2023-02-26 15:38:05
---

# 第一章 创建和销毁对象

## 1. 考虑用静态代替构造方法

想要获取一个类的实例，一种传统的方式是通过共有的构造器，当然还可以使用另一种技术：提供共有的静态工厂方法。

<!--more-->

什么是静态工厂？

```java
public static Boolean valueOf(boolean b) {
    return (b ? TRUE : FALSE);
}
```

为什么要用静态工厂替换构造方法？有什么优点

1. 静态工厂相比构造器来讲，有名字并且通俗易懂，构造器的名字必须和类名一致
2. 静态工厂每次调用不必新建对象。所以适用于不可变的类，单例，初始化就缓存好，避免重复创建。
3. 静态工厂方法能够返回原先返回类型的任意子类型的对象，更加灵活的选择返回对象。例如Collection有32个实现类在Collections中可以返回。
4. 静态工厂可以根据调用传入的不同参数返回不同的对象。

静态工厂的不足之处？

1. 静态工厂没有public和protected的方法，因此不能被子类化。

一般静态工厂方法名字的含义

```java
fromValue(value) //这种通过传入单个参数返回相应类型的实例对象
of(v1,v2,v3) // 传入多个参数，返回报站这些参数的实例。
// valueOf是from of更详细的替代方案
BigInteger prime = BigInteger.valueOf(Integer.MAX_VALUE);
Object newArray = Array.newInstance(classObject, arrayLen);//每次返回的对象都是新的实例
```

## 2. 当遇到多个构造器使用构建者

构造方法和静态工厂共有的限制：不能很好的扩展很多可选参数的场景 。因此对于多个可选参数，考虑使用构建者模式。

其实对于等多个可选参数可以使用新建JavaBean 使用set方法创建实例，这样更通俗易懂但是会很冗长。

builder结合了构造方法的安全性和JavaBean 模式的可读性。

```java
// Builder Pattern
public class NutritionFacts {
    private final int servingSize;
    private final int servings;
    private final int calories;
    private final int fat;
    private final int sodium;
    private final int carbohydrate;
    public static class Builder {
        // Required parameters
        private final int servingSize;
        private final int servings;
        // Optional parameters - initialized to default values
        private int calories      = 0;
        private int fat           = 0;
        
        public Builder(int servingSize, int servings) {
            this.servingSize = servingSize;
            this.servings    = servings;
        }
        public Builder calories(int val) { 
            calories = val;      
            return this;
        }
        public Builder fat(int val) { 
           fat = val;           
           return this;
        }
       
        public NutritionFacts build() {
            return new NutritionFacts(this);
        }
    }
    private NutritionFacts(Builder builder) {
        servingSize  = builder.servingSize;
        servings     = builder.servings;
        calories     = builder.calories;
        fat          = builder.fat;
    }
}
```

为了确保多个参数的不变性不受攻击，可以在builder复制参数后对对象属性进行检查。检查失败抛出非法参数异常（IllegalArgumentException）。

单个builder可以重复使用构建多个不同的对象，对象的参数可以灵活调整，适用多个可选参数。

协变返回类型：一个子类的方法被声明为返回在父类中声明的返回类型的子类型，称为协变返回类型（covariant return typing）。 它允许客户端使用这些 builder，而不需要强制转换。（这个比较有意思）

## 3. 使用私有构造器或者枚举实现单例

单例对象通常表示无状态，不可变对象。

实现单例的几种方式，其中枚举方式最佳，无偿提供了序列化机制，防止多个实例化。可以阻止反射创建实例。

```java
// 单例模式的实现方式一 Singleton with public final field
public class Elvis {
    // 公共静态成员变量
    public static final Elvis INSTANCE = new Elvis();
    // 私有化构造函数
    private Elvis() { ... }
    public void leaveTheBuilding() { ... }
}

// 单例模式的实现方式二 Singleton with static factory
public class Elvis {
    private static final Elvis INSTANCE = new Elvis();
    private Elvis() { ... }
    // 每次调用该方法否返回同一个对象引用
    public static Elvis getInstance() { return INSTANCE; }
    public void leaveTheBuilding() { ... }
}

// 单例模式的实现方式三 Enum singleton - the preferred approach（最佳方式）
public enum Elvis {
    INSTANCE;
    public void leaveTheBuilding() { ... }
}
// readResolve method to preserve singleton property
private Object readResolve() {
     // Return the one true Elvis and let the garbage collector
     // take care of the Elvis impersonator.
    return INSTANCE;
}
```

在实例化过程中为了保证单例不被破坏，生命所有的字段为transient，并提供readResolve方法。否则当序列化实例被反序列化时，就会创建一个新的实例。

## 4. 使用私有构造器实现非实例化

试图通过创建抽象类来实现非实例化是行不通的，因为该类的子类可以被实例化，并且他还可能会误导用户该类是为了继承而设计的。因此使用简单的方式——私有化构造函数实现类的非实例化。

## 5. 依赖注入优于硬链接资源

当多个类依赖于同一个或者多个底层资源时，静态工具和单例模式对于这种场景是不适用的。因为这两种方式再并发场景中变得不可用，更容易出错。

其实每个实例在使用客户端的资源时，可以在创建时将资源的参数传入构造函数中，这就是依赖注入的一种形式（构造方法注入）。这种方式保证了资源的不可变性，依赖注入不仅适用于构造器，也同样适用于静态工厂和Builder。Supplier<T>这个接口就可以很好的标识这些工厂，客户端传入一个工厂，工厂负责创建指定类型的实例。

```java
// 例如生成马赛克的工厂
Mosaic create(Supplier<? extends Tile> tileFactory) { ... }
```

依赖注入可以大幅度提升类的灵活性，可测试性，复用性。

## 6. 避免创建不必要的对象

如果一个对象是不可变的，那么他总能被复用，复用相比于新建更快速。

当不可变类同时提供了构造器和静态工厂方法时，优先使用静态方法来避免创建不必要对象。

自动装箱可能会创建不必要的对象，他模糊了基本类型和装箱类型之间的区别，但是没有消除这种区别，有可能会导致一些性能问题，因此优先使用基本类型而不是装箱类型。

```java
private static long sum() {
    Long sum = 0L;
    for (long i = 0; i <= Integer.MAX_VALUE; i++)
        // Long => long
        sum += i;
    return sum; 
}
```

注意相比于创建新对象，复用的代价更高，如果没能暴增拷贝安全，将会导致潜在的bug和安全漏洞。

## 7. 消除过时的对象引用

内存泄漏：指程序再申请内存后，无法释放已申请的内存空间，内存泄漏堆积后就会发生内存溢出。

内存溢出：报错OOM，没有足够的内存供申请者使用。

一般来讲当一个类自己管理自己的内存时，程序员就要注意内存内存泄露问题了，只要一个元素被释放了，那这个元素包含的所有对象应用都应该被清空。

```java
public Object pop() {
    if (size == 0)
        throw new EmptyStackException();
    Object result = elements[--size];
    elements[size] = null; // Eliminate obsolete reference help gc
    return result;
}
```

消除过期引用的最佳方式是将每个变量定义在最小的作用域中。

缓存是内存泄漏的另一个来源。当将一个对象放到缓存中取，时间长了很容易忘记他还在那，剞劂方法可以使用WeakHashMap来充当缓存，只要key过期后就会被自动清除。

## 8. 避免使用终结方法和清理方法

在Java9中，finalizers方法已经过时了，替代的是清理方法，清理方法比终结方法危险性更低，但仍然是不可预测的，性能比较低，并且也是非必要不使用。

不使用的原因：

- 终结方法和清理方法的缺点在于不能保证被及时执行或会被执行，当一个对象变得不可达，到执行终结方法或清理方法时，这个时间段是任意长的。因此当有对时间要求的任务不应该调用终结或清理方法完成，不应该依赖终结方法或者清理方法来更新重要的持久态。
- 终结方法的另一个问题是在终结过程中会忽略掉抛出的异常，并且不会打印线程终止的堆栈信息。如果另一个线程企图使用这种未捕获异常的对象可能会发生不确定的行为。
- 终结方法和清理方法会严重影响性能。

清理方法和终结方法的两种用途：

1. 当对象的持有者忘记调用终止方法的情况下充当安全网。如 FileInputStream、FileOutputStream、ThreadPoolExecutor、和 java.sql.Connection具有充当安全网终结方法。
2. 本地对灯体是普通对象通过本机方法委托的非Java对象，因为本地对等体不是普通Java对象，因此垃圾收集器不会识别它，当性能可接受且本地对等体没有关键的资源，则可以用清理或者终结方法回收。

## 9. 使用try-with-resources代替try-finally

Java中有许多必须通过调用close方法手动关闭的资源，比如InputStream,OutputStream.

在之前，即使是程序抛出异常或者返回的情况下，try-finally是保证资源正确关闭的最佳方式。但是当处理多个资源关闭时，情况就会变糟。

```java
// try-finally is ugly when used with more than one resource!
static void copy(String src, String dst) throws IOException {
    InputStream in = new FileInputStream(src);
    try {
        OutputStream out = new FileOutputStream(dst);
        try {
            byte[] buf = new byte[BUFFER_SIZE];
            int n;
            while ((n = in.read(buf)) >= 0)
                out.write(buf, 0, n);
        } finally {
            out.close();
        }
    } finally {
        in.close();
    }
}

// try-with-resources on multiple resources - short and sweet
static void copy(String src, String dst) throws IOException {
    try (InputStream   in = new FileInputStream(src);
         OutputStream out = new FileOutputStream(dst)) {
        byte[] buf = new byte[BUFFER_SIZE];
        int n;
        while ((n = in.read(buf)) >= 0)
            out.write(buf, 0, n);
    }
}
```

这个时候，当最里层的finally的close方法关闭失败，外层的的异常就会覆盖掉里层的异常，导致调试过程会很困难。但使用try-with-resourses就可以避免这个问题，并且try-with-resourses代码更加简洁易读。

# 第二章 所有对象都通用的方法

## 10. 覆盖equals方法时请遵守通用约定

因为Object主要是为继承设计的，它的所有非final方法都有清晰地约定，任何类要重写这些方法时，都有义务去遵守这些约定否则其他依赖这些约定的类就不会正常工作。

什么时候不需要覆盖equals方法？

- 每个类的实例都是固有唯一的。如Thread
- 类不需要提供逻辑相等的功能。
- 父类已经重写过equals方法，父类的行为完全适合子类。
- 类是私有的，并且equals方法永远不会被调用。

什么时候需要重写equals方法？

如果一个类需要一个逻辑相等的概念，并且父类没有重写过这个方法，需要在该类中重写equals方法。通常这种类是值类。如Integer，String。

重写equals方法必须遵守的约定。

1. 自反性：对任何费控引用x,x.equals(x)必须返回true。
2. 对称性：对于任何非空引用x和y，如果y.equals(x)=true，则x.equals(y)=true
3. 传递性: x,y,z都不为null，如果x.equals(y)=true，y.equals(z)=true，则z.equals(x)=true。
4. 一致性：如果x,y非空，并且equals比较中的信息没有修改，多次调用x.equals(y)都要始终返回true或false。
5. 对任何非空引用x,x.equals(null)必须返回false。

重写equals方法时，要重写hashCode方法，不要让equals方法干太多事，不要将Object参数类型替换成其他类型。

## 11. 重写equals方法时总要重写hashCode

重写equals方法必须重写hashCode方法，如果没有重写，在使用HasMap或HashSet时无法正常运作。

重写的equals方法必须遵守 Object 中指定的规定。

- 在应用程序的执行期间，只要对象的 equals 方法的比较操作所用到的信息没有被修改，那么对这同一个对象调用多次，hashCode 方法都必须始终如一地返回相同的值。
- 如果两个对象调用 equals（Object）方法比较是相等的，那么调用这两个对象中任意一个对象的 hashCode 方法都必须产生相同的整数结果。
- 如果两个对象根据 equals（Object）方法比较是不相等的，那么调用这两个对象中任意一个对象的 hashCode 方法，则不一定要产生不同的结果。无论如何，开发者应该知道，不相等的对象产生截然不同的结果，有可能提高散列表（hash tables）的性能。

## 12. 始终覆盖toString

默认的Object的toString方法返回的是：类名+@+无符号16进制散列码。

toString 方法应该返回对象中包含的所有值得关注的信息。

在实现toString时，需要判断是否处理返回值的格式。

- 指定字符串的格式的好处：更易读。
- 指定字符串的格式的坏处：一旦被广泛使用，必须始终坚持这种格式。如果改变格式，将会破坏代码和数据。

无论是否指定格式，**都为 toString 返回值中包含的所有信息，提供一种编程式的访问路径。否则不得不自己去解析，解析过程可能会出错。**

## 13. 谨慎覆盖clone

假设我们需要为一个类实现Cloneable接口，这个类的父类提供了一个良好的clone方法。我们从super.clone中得到的对象将会是原始对象的一个完整克隆。类中声明的任一属性的值将会和原始类对应的属性的值相等。如果每个属性包含了基本类型值或者不过变对象的引用，那么返回的对象可能正是我们要的，在这种情况下，不需要进一步的处理。

如果一个类它的所有父类获取clone的对象是通过调用super.clone，那么*x.clone().getClass() == x.getClass()。*

对于不可变的类不应该提供clone方法，因为这会造成无意义的拷贝。对于final修饰的属性，克隆不会成功因为禁止向final修饰的属性二次赋值。

**实际上，clone方法就是另一个构造器，我们必须保证它不会破坏原始对象而且能恰当创建被克隆对象的约束条件。**

## 14. 考虑是否实现comparable

compareTo方法并没有在Object里被声明，而是在Comparable接口中声明的唯一方法。

假如一个类实现了Comparable接口，那就表明了这个类的各个实例之间是有顺序的。几乎所有的Java类库，包括枚举类型（条目34），都实现了Comparable接口。

在下面的表述中，符号sgn（expression）表示数学中的signum函数，返回值为-1，0，1。

- 实现类必须确保对于所有的x和y，sgn(x.compareTo(y)) == -sgn(y. compareTo(x))成立。（这意味着，当且仅当y.compareTo(x)抛出了异常，x.compareTo(y)也必须抛出异常。）（自反性）
- 实现类必须确保关系的传递性：若(x. compareTo(y) > 0 && y.compareTo(z) > 0)，则x.compareTo(z)>0。
- 最后，实现类必须确保若x.compareTo(y) == 0，则对于所有的z，sgn(x.compareTo(z)) == sgn(y.compareTo(z))成立。（一致性）
- 强烈建议(x.compareTo(y) == 0) == (x.equals(y))成立，但这并不是必须的，通常来说，任何实现了Comparable接口的类如果违反了这个条件，那么应该做个说明。推荐的说法是“注意：该类具有自然排序，但是与equals方法不一致。”

当遇到不同类型的实例比较时，会抛出ClassCastException异常。

在compareTo方法里，我们对属性进行比较是为了得到一个顺序而不是看其是否相等。为了比较对象引用的属性，我们可以递归地调用compareTo方法。如果一个属性没有实现Comparable接口或者我们需要一个非标准的顺序，可以使用Comparator来替代。

```java
private static final Comparator<PhoneNumber> COMPARATOR = comparingInt((PhoneNumber pn) -> pn.areaCode)
.thenComparingInt(pn -> pn.prefix)  
.thenComparingInt(pn -> pn.lineNum);
public int compareTo(PhoneNumber pn) { 
    return COMPARATOR.compare(this, pn);
}
```

compareTo或compare方法依赖于两个值之间的差值，若第一个值小于第二个值，则为负，若两个值相等，则为0，若第一个值大于第二个值，则为正。在实现compareTo方法时，避免使用 < 和 > 运算符来进行属性值的比较。相反，我们应该使用封箱基本类型的静态比较方法（例如Integer.compare），或者Comparator接口里的比较器构造方法（例如Comparator<Object> hashCodeOrder = Comparator.comparingInt(o -> o.hashCode());）。

# 第三章 类和接口

## 15. 最小化类和成员的访问性

封装：尽量让每个类或者成员尽可能的不可访问。

如果一个顶层的类或者接口的访问修饰符是private，那么后续你可以修改，替换甚至删除他，而不必担心损害现有的方法，如果是public就需要永远支持，保证兼容性。

如果想要测试代码，需要访问一个类的方法，将private->default是可接受的，但是提高到更高的访问级别是不可接受的。

- public类中的成员变量尽量不应该也是public。
- 对于公有静态常量命名通常是大写字母组成，单词之间通过下划线分开。
- 让一个类具有共有静态数组，或者返回这种数组的方法是不可取的，因为客户端调用时可以随意修改数组的内容是一个安全漏洞。（确保被公有静态final域引用的对象是不可变的）

```java
public static final Thing[] VALUES = { ... };
// 可以改为如下,public -> private 同时添加公有不可变的数组
private static final Thing[] VALUES = { ... };

public static final List<Thing> VALUES = Collections.unmodifiableList(Arrays.asList(PRIVATE_VALUES)) ;
```

## 16. 在公有类中使用访问方法而不是公有域

- 公有类应该永远都不要暴露可变域。因为在暴漏之后如果想要更改数据域的字段时就会牵一发而动全身。（客户端代码已经在各处使用了）
- 对于公有类暴露不可变域的情况，虽然危害小一些，但也仍是有问题的。
- 如果一个类在包外可以被访问，就应该提供访问方法

## 17. 可变性最小化

不可变类的好处：更安全，不容易出错，容易使用。（如String,BigDecimal等）

1. 不可变对象天然是线程安全的，不要求同步，不可变对象可以被自由共享，通常也是被static修饰的。
2. 不可变对象为其他对象提供了大量的构件，可以作为map的key,集合的元素，不会破坏考核或者map这种不变性.
3. 不可变对象提供了免费的失败原子机制。状态不会出现临时的不一致性。

实现不可变类遵循的几个规则：

1. 不提供修改对象状态的方法。如setter
2. 确保这个类不能被继承。用final修饰，阻止子类改变对象的状态，从而破坏不可变性。
3. 所有数据域设置为private final，一个实例在线程之间传递确保正确，并防止对象被修改。
4. 确保对任务可变组件的互斥访问。



缺点是：对于大对象来讲，每个不同的值都需要一个对应的对象。创建对象的成本会很高。

解决方法：

1. 对于创建中重复的步骤，可以用基本数值类型来代替，这样不用每个步骤创建一个对象。
2. 创建一个公有的伙伴类，类似于String和StringBuilder的关系。

注意：如果不可变类实现了序列化接口，同时不可变类还包含了对个指向可变对象的引用，这时候需要显示提供一个readObject方法和readResolve方法，不然攻击者可以通过反序列化方式创建该类的可变实例。



不要每写一个getter就要冲动着去写一个对应的setter。**类应该都是不可变的，除非有个很好的理由需要它们是可变的，如果一个类不能做成不可变，那就尽可能限制它的可变性。这样可以减少出现的错误。**

**构造器应该完全初始化对象，并建立好不变性。**除非有很强的理由，否则不要在构造器或静态方法之外还提供公有初始化方法。

## 18. 组合优于继承

继承是复用代码的方式，但同时也违反了封装原则。子类需要依赖父类的实现来实现自己的功能。如果父类产生变化，子类将会被破坏，需要跟着父类一起演化。

继承只适用于一个类的类型的确是某个父类的子类型的情况。换句话说，只有当类B和类A是“is-a”的关系时，类B才应该扩展类A。是否每个B都确实是一个A？如果你对这个问题无法肯定地回答yes，那么B就不应该扩展A。

如果子类在一个与父类不同的包中且父类本来就不是设计来被继承的，那么继承将会导致子类的脆弱性。为了避免这种脆弱性，我们应该使用组合与转发，而不是继承，尤其是存在一个适当的接口来实现一个现存的包装者类。包装者类不仅比子类更健壮，而且更强大。

## 19. 要么涉及继承提供文档，要么禁止继承

一个类的文档必须说明在哪些情况下它会调用可子类的覆盖方法。例如，调用可能来自后台线程或者静态初始器。

文档明确说明覆盖迭代方法将会产生的影响，描述方法是怎么做的。这便是继承复杂的一点。

测一个被继承类的唯一方式是编写子类，如果忽略某个保护成员，就会出现问题，在子类中暴漏出来。

如果一个了类允许被继承，必须有约束条件需要遵循。

1. 构造函数中一定不要调用可覆盖的方法。否则会导致程序失败。
2. 如果决定让设计被继承的类实现Serializable接口，而且这个类拥有readResolve方法或writeReplace方法，你一定要把readResolve方法或writeReplace方法设为受保护的，而不是私有的。

如果某个类的确是要被子类化，否则最好将类声明为final或者保证其没有可访问的构造器来禁止该类被继承。

## 20. 接口优于抽象类

有两种方式可以定义一个多实现的接口：接口和抽象类；

因为Java只允许单继承，所以约束了抽象类作为类型定义的使用，但是接口可以被任意一个类所实现，不管类处于那个位置。

现有类可以很容易实现一个新接口，但是想要扩展一个相同的抽象类只能通过继承的方式，但是这种方式会带来较大的负面影响，强迫所有后代类都继承这个父类无论合不合适。

使用包装类可以安全的增强接口的功能，如果使用抽象类除了继承别无他法。

接口和抽象类可以搭配使用，接口中定义最基础的方法，抽象类实现这些基本的方法，其他子类可以选择是否继承这个抽象类，也可以选择实现最顶层的接口。这样更加灵活。例如Map.Entry的实现，因为接口中不能重写Object的equals和hashcode方法，所以这两种最基本的方法交给抽象类实现。

## 21. 为后代设计接口

Java8中添加了默认方法，目的是为了可以将方法加入现有的接口，但是在现有接口里添加的新方法是充满风险的。

在Java 8里，很多新的默认方法都被加入核心的集合接口里，这主要是为了促进lambda表达式的使用。

因为在接口中加入默认方法虽然可以通过编译但是在运行时可能会出错，这种事件不常有但是并不是不存在。因此应该避免在接口中添加新的default方法。如果必须要添加的话，需要考虑现有的实现类是否会收到影响。

## 22. 接口只用于定义类型

当类实现接口时，该接口作为实现类实例的引用。有种接口不符合这种目的，即常量接口，这种接口不包方法，只有静态final常量。

常量接口的缺点：

实现这个常量接口的实现类会泄露这些细节，这个类的子类的命名空间都会被接口的常量污染。

如果想要导出常量，有两种合适的方式。

1. 将这些常量添加到类或者相关的接口里。
2. 新增枚举类型来导出这些常量。
3. 这些常量放在不可初始化的工具类里面。
4. 总之，接口应该只被用来定义类型。它们不能仅仅是用来导出常量。

## 23. 类层次优于标签类

标签类和类的层次：

```java
class Figure {
    enum Shape { RECTANGLE, CIRCLE };
    // Tag field - the shape of this figure
    final Shape shape;
    // These fields are used only if shape is RECTANGLE
    double length;
    double width;
    // This field is used only if shape is CIRCLE
    double radius;
    // Constructor for circle
    Figure(double radius) {
        shape = Shape.CIRCLE;
        this.radius = radius;
    } 
    // Constructor for rectangle
    Figure(double length, double width) {
        shape = Shape.RECTANGLE;
        this.length = length;
        this.width = width;
    } 
    double area() {
        switch(shape) {
            case RECTANGLE:
                return length * width;
            case CIRCLE:
                return Math.PI * (radius * radius);
            default:
                throw new AssertionError(shape);
        }
    }
}
// Class hierarchy replacement for a tagged class
abstract class Figure {
    abstract double area();
}
class Circle extends Figure {
    final double radius;
    Circle(double radius) { 
        this.radius = radius; 
    }
    @Override 
    double area() { 
        return Math.PI * (radius * radius); 
    }
} 
class Rectangle extends Figure {
    final double length;
    final double width;
    Rectangle(double length, double width) {
        this.length = length;
        this.width = width;
    } 
    @Override 
    double area() { 
        return length * width;
    }
}
```

应该避免标签类，标签类中有标签域，Switch语句，如果想要添加新的标签，必须在Switch语句中加case分支，否则会运行失败，标签类太过冗长并且不易阅读，出错率高。

我们可以将标签类转化为类层次的结构。

通过抽象出公有的标签值的方法。让每个子类继承抽象类，定义自己特有的数据域。

类层次的优点是，提高了代码的灵活性，清晰的展示了类之间的层次关系，并且可进行更好的变异检查。

## 24. 静态成员类优于非静态成员类

嵌套类是为了服务它所在的外围类。如果一个嵌套类还可以用于其他地方，那么应该单独放一个源文件里。

嵌套类的种类：静态成员类，非静态成员类，匿名内部类，局部类。

静态成员类：可以声明再其他类的内部，并且可以访问外围的所有成员变量。通常用法是和外围的类一块使用处理简单逻辑。

非静态成员类：不被static修饰的成员类，非静态实例被创建时就与外部类关联，并且关联后不可修改。常被用来定义适配器，例如Set,List中通过非静态成员类实现他们自己的迭代器。

```java
public class MySet<E> extends AbstractSet<E> {
... // Bulk of the class omitted
    @Override 
    public Iterator<E> iterator() {
        return new MyIterator();
    } 
    private class MyIterator implements Iterator<E> {
        ...
    }
}
```

**如果你声明了一个不需要访问外围实例的成员类，那你总是应该static修饰符加到声明里去**，使得这个成员类是静态的。如果你不加这个修饰符，那么每个实例都将包含一个隐藏的外围实例的引用。更严重的是，当这个外围实例已经满足垃圾回收的条件时，非静态成员类实例会导致外围实例被保留。因此而导致的内存泄露是灾难性的。

匿名类：不是外围类的成员，没有名字，在代码任意一个表达式合法的地方，匿名类都可以使用。匿名类使用的限制：在声明之后无法再初始化，并且不能通过instanceof测试或者指定类名的操作，匿名类必须简短，否则会影响可读性。匿名类的另一个用法是实现静态工厂方法。lambda表达式出现后，创建小的函数对象通常首选lambda。

## 25. 限制源文件为单个顶级类

永远不要将多个顶级类或接口放到一个源文件里。遵守这条规则就能保证在编译时不会遇到一个类有多个定义的情况。这又保证了编译产生的class文件和随之产生的程序行为不会依赖于传给编译器的源文件顺序。

程序的行为受传递给编译器的源文件顺序的影响，这是无法接受的。

解决方法那就是将这些顶级类分别写到各自的源文件里去。如果你尝试将多个顶级类放入同一个源文件，可以考虑使用静态成员类（条目）作为将不同类拆分为单独源文件的替代办法。

如果某些类是为其他类提供服务的，那么将这些类声明为静态私有成员类，这样可以减少类的可访问性，并且增强可阅读性。

# 第四章 泛型

## 26. 不要使用原始类型

泛型类型：接口和泛型类

泛型类型都定义了一组参数化的类型，如List<String> 表示元素是String类型的列表。

不应该使用原始类型，如List list = new ArrayList();

这样做如果加入的对象类型不一样虽，然可以通过编译，但是运行时会报错ClassCastException异常异常；应该使用参数化类型，这样在编译期间就可以发现错误，更加安全。

无限制通配符类型：Set<?>（读作，某些类型的集合），他和原始类型的区别是，通配符类型更加安全，当你讲任意非null得元素放入集合总，就会产生编译时错误。

原始类型被提供仅是为了兼容性以及能与引入泛型之前的遗留代码互用。

原始类型可以用在以下两种情况：

1. List.class,Set.class,
2. if(o instanceof Set)

## 27. 消除未检查警告

如果你无法消除某个警告，但是这个警告的代码是安全的，可以使用@SuppressWarnings("unchecked")注解来禁止这个警告。

SuppressWarnings注解可以声明在局部变量，方法，类上，但是应该尽可能的在小的作用域使用。每次使用这个注解应该加上注释，说明类型转换是安全的，可以帮别人理解这段代码。

每个未检查警告都表示可能在运行时出现ClassCastException异常，所以不要忽视他们。

## 28. 列表优先于数组

数组与列表的区别:

协变性：如果Sub是Super的一个子类型，那么数组类型Sub[]也是数组类型Super[]的子类型。

可具化：在运行时才知道并检查元素类型。

数组是协变的并可具化的；泛型是受约束并且可擦除的。因此，数组提供了运行时类型安全性但不保证编译时类型安全性，泛型则反过来。通常，数组和泛型不能很好混用.

数组在运行时才去检查元素的类型，如果将一个String加入Long的数组里，会抛出一个ArrayStoreException；泛型是在编译期间去检查的，运行时会擦除元素类型，泛型擦除使得泛型类型可以自由与从未使用过泛型的代码互相调用。因此使用泛型列表可以尽早发现错误。

```java
//  generic array creation is illegal - won't compile
List<String>[] stringLists = new List<String>[1]; // (1)
List<Integer> intList = List.of(42); // (2)
Object[] objects = stringLists; // (3)
objects[0] = intList; // (4)
String s = stringLists[0].get(0); // (5)
```

为了尽可能避免出现泛型数组创建错误或者未检查异常，最好优先使用集合类型，它更安全。

## 29. 优先考虑使用泛型类

与强制转换类型相比，泛型更方便和安全，这通常意味着设计更加通用，客户端代码不用强制转换类型就可以使用泛型类的方法。

## 30. 优先考虑使用泛型方法

Collections类的所有“算法”方法（如binarySearch方法和sort方法）都是泛型的。

常用泛型方法：

```java
// union s1 s2
public static <E> Set<E> union(Set<E> s1, Set<E> s2) {
    Set<E> result = new HashSet<>(s1);
    result.addAll(s2);
    return result;
}
```

泛型单例方法：

```java
private static UnaryOperator<Object> IDENTITY_FN = (t) -> t;
@SuppressWarnings("unchecked")
public static <T> UnaryOperator<T> identityFunction() {
    return (UnaryOperator<T>) IDENTITY_FN;
}
```

递归类型限制：

```java
// 任意能和自身比较的类型E
public static <E extends Comparable<E>> E max(Collection<E> c);
```

应该保证你的方法不用客户端强转就能用，这意味着要将这些方法泛型化，你也应该将现有方法泛型化，让新用户用起来更简单，而且不用破坏现有客户端。

## 31. 使用有限制通配符来增加API灵活性

通配符类型：<? super E>, <? extend E>

使用通配符的基本原则：PESC，一个参数化类型表示T类型的生产者，用<? extend E>；如果一个参数化类型代表一个T类型的消费者，则使用<? super T>。GET和PUT 原则。

通配符如果使用得当，对使用者来讲通配符的添加几乎是不可见的，通配符使得这些方法应该接收哪些参数，拒绝哪些参数。

返回类型不要用限制的通配符。因为这样强制客户端使用通配符类型。

## 32. 合理结合泛型和变长参数

可变长参数的目的是为了允许客户端可以在方法里传入数量可变的参数，当你调用一个变长参数方法时，一个数组就会被创建，并用来存储这些参数，当变长参数是泛型类型或者参数化类型时，会得到编译器警告。

@SafeVarargs注解表示允许可变参数的方法使用泛型，并且禁止警告。除非确定了使用是安全的，否则不要使用这个注解。并且这个注解只对不重写的方法时合法的，Java8中仅仅对静态方法和final实例方法合法。

泛型可变参数是安全的情况：

1. 不在可变参数数组中存储数据
2. 对外部代码不可见。

```java
static<T>List<T>pickTwo(Ta,Tb,Tc){
switch(rnd.nextInt(3)) {
 case 0: return List.of(a, b);
 case 1: return List.of(a, c);
 case 2: return List.of(b, c);
}
 throw new AssertionError(); 8}

public static void main(String[] args) {    
  List<String> attributes = pickTwo("Good", "Fast", "Cheap");
}
```

## 33.考虑类型安全的异构容器

泛型在容器中通常用法限制了每个容器类型参数的数量，可以使用Class对象作为类型安全异构容器的key，value是对应参数类型，以这种方式使用的Class对象被叫做类型令牌。

Favorites类称为类型安全的异构容器

```java
public class Favorites {
    private Map<Class<?>, Object> favorites = new HashMap<>();
  	public <T> void putFavorite(Class<T> type, T instance) {
    	favorites.put(type, type.cast(instance));
    }
    public <T> T getFavorite(Class<T> type) {
        return type.cast(favorites.get(type));
    }
    public class Class<T> {
    T cast(Object obj);
}
}
```

# 第五章 枚举和注解

## 34.用枚举替换常量

枚举类型（enum type）是指由一组固定的常量组成合法值的类型。在java 还没有引入枚举类型之前，通常使用int具名常量表示（如四季，月份，花色等）。

Java枚举本质上是int值。枚举是单例的泛型化，是受控制的，每个数据都是final的，枚举还允许添加任意的方法和域，并实现任意的接口，提供了Object的所有方法，实现了Comparable和Searializable，并针对枚举类型的可任意改变性设计了序列化方式。

枚举中的抽象方法必须被他所有常量中的具体方法覆盖。

什么时候可以使用枚举？

只要是在编译时已知的常量就可以使用枚举来代替。

枚举相比于int常量的优点：更好的可读性，安全性，更加强大，如果有多个枚举值同时有共享的行为，考虑使用策略枚举。

## 35.使用实例域来替换序数

每个枚举都有一个ordinal方法，他返回每个枚举在类型中的数字位置。

```java
public enum Ensemble {
    SOLO, DUET, TRIO, QUARTET, QUINTET,
    SEXTET, SEPTET, OCTET, NONET, DECTET;
    public int numberOfMusicians() { return ordinal() + 1; }
}
```

但是如果改变枚举变量中的顺序就会将这些常量重新排序，numberOfMusicians方法就会被破坏。

永远不要根据枚举的序数导出与它关联的值，而是要将它保存在一个实例域中：

```java
public enum Ensemble {
    SOLO(1), DUET(2), TRIO(3), QUARTET(4), QUINTET(5),
    SEXTET(6), SEPTET(7), OCTET(8), DOUBLE_QUARTET(8),
    NONET(9), DECTET(10), TRIPLE_QUARTET(12);
    private final int numberOfMusicians;
    Ensemble(int size) { this.numberOfMusicians = size; }
    public int numberOfMusicians() { return numberOfMusicians; }
}
```

## 36.使用EnumSet替换位域

位域：使用位运算讲几个常量合并到一个集合中，这个集合就是位域。

当打印输出位域时，很难理解这些常量的含义。所以使用EnumSet来代替。

EnumSet的优点：性能好（removeAll,retainAll方法都是利用位运算实现的），并且枚举更简洁表示含义更清晰。

```java
public class Text {
    public enum Style { BOLD, ITALIC, UNDERLINE, STRIKETHROUGH }
    // Any Set could be passed in, but EnumSet is clearly best
    public void applyStyles(Set<Style> styles) { ... }
}
// 使用EnumSet.of()
text.applyStyles(EnumSet.of(Style.BOLD, Style.ITALIC));
```

## 37.使用EnumMap替换序数索引

有时会用到Enum.ordinal方法，但是不推荐使用。

例如现在想要列出植物园中一年生，两年生，多年生植物。需要创建集合数组，每个生命周期的植物是一个集合。遍历整个花园的植物将对应生命周期的植物放在对应的集合中。

```java
Set<Plant>[] plantsByLifeCycle =
    (Set<Plant>[]) new Set[Plant.LifeCycle.values().length];
for (int i = 0; i < plantsByLifeCycle.length; i++)
    plantsByLifeCycle[i] = new HashSet<>();
for (Plant p : garden)
    plantsByLifeCycle[p.lifeCycle.ordinal()].add(p);
// Print the results
for (int i = 0; i < plantsByLifeCycle.length; i++) {
    System.out.printf("%s: %s%n",
}
```

因为数组不兼容泛型，也不知道数组中的索引代表什么，如果使用出错会抛出 ArrayIndexOutOfBoundsException 异常 。

可以使用EnumMap来代替数组的形式。Map的key是植物的生命周期枚举类型，value对应的是这种生命周期的所有植物。其实EnumMap内部就了这样的一个索引数组，只是隐藏操作数组的细节。

```java
Map<Plant.LifeCycle, Set<Plant>>  plantsByLifeCycle =
    new EnumMap<>(Plant.LifeCycle.class);
for (Plant.LifeCycle lc : Plant.LifeCycle.values())
    plantsByLifeCycle.put(lc, new HashSet<>());
for (Plant p : garden)
    plantsByLifeCycle.get(p.lifeCycle).add(p);
```

总之使用EnumMap来代替索引数组，当出现对象之间的关系是多维的，使用EnumMap<key1, EnumMap<key,2 val>>

## 38.使用接口来模仿可扩展的枚举

操作码用例可以使用可伸缩性的枚举类型实现。操作码的元素表示在某种机器上的操作。

定义操作接口，枚举实现这个接口。

```java
// Emulated extensible enum using an interface
public interface Operation {
    double apply(double x, double y);
}
public enum BasicOperation implements Operation {
    PLUS("+") {
        public double apply(double x, double y) { return x + y; }
    },
    MINUS("-") {
        public double apply(double x, double y) { return x - y; }
    },
    TIMES("*") {
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE("/") {
        public double apply(double x, double y) { return x / y; }
    };
    private final String symbol;
        BasicOperation(String symbol) {
        this.symbol = symbol;
    }
    @Override
    public String toString() {
        return symbol;
    }
}
```

虽然枚举不能多实现但是，接口支持多实现，可以定义多个枚举实现这个接口。并用新的实现类代替基本类型。

用接口实现可伸缩枚举的不足之处是：枚举不能继承另一个枚举。如果代码不依赖任何枚举的状态，就可以在接口中添加默认实现。java.nio.file.LinkOption 枚举类型实现了 CopyOption 和 OpenOption 接口。

## 39.注解优先于命名模式

命名模式：表名一些程序需要通过某种工具或者框架进行特殊处理。

缺点：

1. 如果命名出现错误，就不会执行但是也不会报错。
2. 不能确保他们只用在相应的程序元素上。比如有个名字叫TestSafetyMechanisms的类，想要测试这个类中的所有方法，但是Junit3不会执行，因为这个类中的方法名不是test开头的。
3. 命名模式没有提供将参数值将程序元素相关联的方法。

JUnit 从第 4 版开始采用@Test注解，解决了以上问题。Test注解只在方法上起作用，不能被用在类上或者其他元素上，否则编译不过。因为Test注解没有参数所以叫做标记注解。注解永远不会改变被注解代码的语义，但是使它可以通过工具进行特殊的处理。

注解的处理是使用反射执行标记了注解的方法，在执行过程中捕获异常并打印日志，还可以获取到注解上的参数，并校验参数类型。注解中的数组参数语法很灵活，指定多元素数组使用{}包裹，并用逗号分隔开。

## 40. 坚持使用Overide注解

@Override注解用户方法声明，表示被注解的方法会覆盖父类的方法，如果坚持使用这个注解，可以防止一大类的非法错误。

比如Bigram类本身想要重写父类Object的hashCode和toString方法，但是因为类型错误，没能覆盖而是重载了equals方法。并且因为没有标注@Overide所以在编译的时候没能发现这个错误。

```java
// Can you spot the bug?
public class Bigram {
    private final char first;
    private final char second;
    public Bigram(char first, char second) {
        this.first = first;
        this.second = second;
    }
    // 参数类型应该是Object
    public boolean equals(Bigram b) {
        return b.first == first && b.second == second;
    }
    public int hashCode() {
        return 31 * first + second;
    }
    public static void main(String[] args) {
        Set<Bigram> s = new HashSet<>();
        for (int i = 0; i < 10; i++)
            for (char ch = 'a'; ch <= 'z'; ch++)
                s.add(new Bigram(ch, ch));
        System.out.println(s.size());
    }
}
```

## 41. 标记接口定义接口类型

标记接口：接口中不包含任何方法声明。例如Serilizable接口。

标记接口比标记注解的两个优点：

1. 标记接口定义的类型是可被实例类实现的，但是注解不行。标记接口类型允许在编译时捕获错误但是注释只能在运行时捕获错误。
2. 可以被更加精确的锁定，如果注解类型使用ElementType.TYPE声明，他就表示可以被应用到任何类或者接口。

什么时候使用标记注解？

如果标记的不是类和接口，就使用注解。如果标记要应用到类和接口这时候考虑我是否想要编写一个或者多个具有该标记的方法呢？如果是就优先使用标记接口。

# 第六章 Lambda和Stream

## 42. lambda表达式优先于匿名类

在Java8之前创建函数对象的主要方式是匿名类。

```java
Collections.sort(words, new Comparator<String>() {
    public int compare(String s1, String s2) {
        return Integer.compare(s1.length(), s2.length());
    }
});
```

匿名类适用于需要函数对象的经典面向对象设计模式，尤其是策略模式，比较器接口是排序的抽象策略。

在Java8中引入了函数式接口，允许使用lambda表达式创建这些接口实例。

```java
Collections.sort(words,
        (s1, s2) -> Integer.compare(s1.length(), s2.length()));
```

编译器从上下文中根据类型推断推导出这些参数的类型，在某些时候，需要指定参数类型，否则编译器无法确定这些参数类型。

与其他方法和类不同，lambda没有名称和文档；如果计算不是自解释的，或者超过几行，则不要将其放入lambda表达式中，如果lambda表达式太长会影响可读性。

除非必须创建非函数式接口类型的实例，否则不要使用匿名类作为函数对象。

## 43. 方法引用优于lambda表达式

lambda优于匿名类的主要优点是更加简洁，Java提供了生成函数对象的方法比lambda还要简洁。两者在选用过程中哪个简洁使用哪个。

| **Method Ref Type** | **Example**         | **Lambda Equivalent**                              |
| ------------------- | ------------------- | -------------------------------------------------- |
| Static              | Integer::parseInt   | str -> Integer.parseInt(str)                       |
| Bound               | Integer::parseIntr  | Instant then = Instant.now(); t -> then.isAfter(t) |
| Unbound             | String::toLowerCase | str -> str.toLowerCase()                           |
| Class Constructor   | TreeMap<K, V>::new  | () -> new TreeMap<K, V>                            |
| Array Constructor   | int[]::new          | len -> new int[len]                                |

## 44. 优先使用标准的函数式接口

6哥基本的函数式接口

| **Interface**  | **Function Signature** | **Example**         |
| -------------- | ---------------------- | ------------------- |
| UnaryOperator  | T apply(T t)           | String::toLowerCase |
| BinaryOperator | T apply(T t1, T t2)    | BigInteger::add     |
| Predicate      | boolean test(T t)      | Collection::isEmpty |
| Function<T,R>  | R apply(T t)           | Arrays::asList      |
| Supplier       | T get()                | Instant::now        |
| Consumer       | void accept(T t)       | System.out::println |

如果基本的函数式接口可以满足你的要求，那应该优先使用它而不是新建功能接口。

Function接口有9个变体，如果源类型和结果类型都是基本类型则使用源类型作为前缀的Function，例如LongToIntFunction，如果源类型是基本类型但是结果类型是引用类型，则使用ToObj前缀的Function，如DoubleToObjFunction。

什么时候考虑编写新的功能接口（Comparator）而不是使用标准接口？

- 该接口将被普遍使用
- 具有相关的约定
- 受益于自定义的默认方法

其他大部分情况使用Function提供的标准接口。

## 45. 明智地使用streams

流：表示有限或无限的数据元素序列；

流管道：表示对这些元素多阶段的结算

流管道的计算是惰性的，直到调用teminal操作时才开始计算，并且对完成terminal操作不需要的数据元素不会计算。默认情况下流管道按照顺序运行。

流API非常通用，实际上任何计算都可以使用流执行，如果使用得当可以使程序更加简短清晰。使用不当会导致程序难以读取和维护。

lambda表达式的餐胡命名对于流管道的可读性至关重要。

在流管道中使用helper方法比在循环中重要。

在lambda表达式中，只能读取final的变量，不能修改任何局部变量。

flatMap：将流扁平化。将Stream中的每个元素映射到新的流然后关联起来。

## 46. 优先使用Stream无副作用的函数

流管道编程的本质是无副作用的对象，这适用于传递给流和相关对象。foreach方法仅用于输出计算结果，还不适用于执行计算。收集器常见的有，toList，toSet，toMap，groupingBy和join。

养成将collecto()方法中放静态方法的习惯，因为这样可读性更高。

toMap操作如果一个key对应了多个流元素就会抛出IllegalStateException异常来终止。这时候使用三个参数的toMap()

```java
toMap(keyMapper, valueMapper, (v1, v2) -> v2)
```

当发生冲突，执行第三个参数设置的last-write-wins策略。

## 47. Stream优先使用Collection作为返回类型

如果编写一个的方法知道会在流管道中使用，可以返回Stream，类似的如果仅用于遍历序列则可以返回Iterable接口。

Collection是Iterable的子类型，因此可迭代并支持Stream，因此，Collection或者他的子类是返回方法的最佳返回类型。

如果返回的数据量小并且可以放入内存中，那么最好返回标准的集合。如果数据太多，不要作为集合返回。

## 48. 谨慎使用Stream并行

如果源来自 Stream.iterate，或者使用中间操作限制，并行化管道也不太可能提高其性能。所以不要不加选择的使用并行流导致性能灾难。

并行性的性能增益最好是在 ArrayList，HashMap，HashSet 和 ConcurrentHashMap 实例上；int 数组；和 long 数组。因为它们都可以准确且分成任何所需大小的子范围。

这使得在并行线程之间划分工作变得容易。

并行流不仅有可能会导致性能上的问题，还可能导致不正确的结果和不可预测的行为（安全失败）。使用.map,filter其他不规范的功能丰富都可能导致并行的安全出问题。

通常所有的并行流管道都在公共fork-join线程池中运行。单个行为不当的管道流会影响系统中其他不想关的部分。

总之除非使用并行流之后得到的结果是正确的并且相比之前对性能上有预期的提升，否则不应该尝试使用并行的管道流。

# 第七章 方法

## 49. 校验参数有效性

大多数方法包括购绽放发对于参数值都有某些限制，例如引用类型必须不能为null，数组下标必须大于等于0等。校验参数如果出现错误抛出一个参数娇艳异常，不在进行后续的操作。

Java7中添加的 Objects.requireNonNull(Object obj, "errorMessage") 可以校验对象引用不为null，比较灵活。

Java 9 中，范围检查工具被添加到 java.util.Objects 中。该工具由三个方法组成：checkFromIndexSize，checkFromToIndex 和 checkIndex。此工具不如空检查方法灵活。它不允许你自定义异常的详细消息，它仅用于列表和数组索引。

每当编写方法或者构造器的时候，应该考虑它的参数有哪些限制。应该把这些限制写到文档中，并且在这个方法体的开头处，通过显式的检查来校验这些限制。养成这样的习惯是非常重要的。

## 50. 必要时进行保护性拷贝



# 第八章 通用设计

# 第九章 异常

# 第十章 并发

# 第十一章 序列化









































在线阅读地址：[Effective Java](https://jiapengcai.gitbooks.io/effective-java/content/chapter1/di-1-tiao-ff1a-kao-lv-yong-jing-tai-fang-fa-er-bu-shi-gou-zao-qi.html)